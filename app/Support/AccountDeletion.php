<?php

namespace App\Support;

use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\UserNotification;
use App\Events\OwnerAccountDeleted;
use App\Events\MemberLeftProject;
use App\Events\ProjectDeleted;
use Carbon\Carbon;

class AccountDeletion
{
    /**
     * Unwinds a user's project involvement (freezing in-review/done tasks pending
     * resolution, resetting the rest, notifying owners/managers) and soft-deletes the
     * account. Deliberately does NOT remove the user's project memberships yet, whether
     * they own a project or are just a member of one — membership only actually goes
     * away once the post-deletion grace period ends without a restore (owned projects
     * are deleted outright by PurgeDeletedAccounts; memberships in other projects are
     * cascade-detached automatically when forceDelete() removes the users row for real,
     * via project_user's onDelete('cascade') FK). Until then, the account being
     * soft-deleted already hides it from every ordinary member query (User uses
     * SoftDeletes, which applies its own "not trashed" global scope), so nothing shows
     * a ghost member in the meantime — and a restore within the grace period puts
     * everything back exactly as it was, with no membership to re-add. Shared by the
     * self-service deletion flow (AccountController::confirmDeletion, reached via a
     * signed email link) and admin-forced deletion (AdminController::destroy/
     * destroyBulk), so both paths leave projects and other members in exactly the same
     * state. Callers are responsible for anything specific to how the deletion was
     * triggered (activity logs, notifying the deleted user themselves, etc).
     */
    public static function unwindProjectsAndDelete(User $user): Carbon
    {
        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);
        $graceEndsAt = now()->addDays($graceDays);

        foreach ($user->projects as $project) {
            if ($project->owner_id === $user->id) {
                $recipients = $project->members()->where('users.id', '!=', $user->id)->get();

                foreach ($recipients as $recipient) {
                    if (NotificationPreferences::wantsType($recipient, 'owner_account_deleted')) {
                        $notification = UserNotification::create([
                            'user_id' => $recipient->id,
                            'type' => 'owner_account_deleted',
                            'causer_id' => $user->id,
                            'message' => "Owner account deleted\n**{$user->name}**, the **owner** of \"**{$project->name}**\", deleted their account. The project itself is unaffected for now, but it's worth exporting anything you need — if they don't restore their account by the end of **" . $graceEndsAt->format('M j, Y') . '**, it and everything in it will be gone for good.',
                            'url' => route('projects.show', $project->id, false),
                        ]);

                        try {
                            broadcast(new OwnerAccountDeleted($recipient->id, $user->name, $project, $graceEndsAt->toIso8601String(), $notification->id))->toOthers();
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }

                    NotificationMailer::send(
                        $recipient,
                        'project.owner_account_deleted',
                        "{$project->name}'s owner deleted their account",
                        [
                            "**{$user->name}**, the **owner** of \"**{$project->name}**\" (#{$project->id}), deleted their account.",
                            "The project stays exactly as it is for now. If they don't restore their account by the end of **" . $graceEndsAt->format('M j, Y') . "**, the project and everything in it will be permanently deleted along with it — you may want to export anything you need before then.",
                            'If they log back in and restore their account before then, nothing changes and this notice can be ignored.',
                        ],
                        route('projects.show', $project->id),
                        'View Project'
                    );
                }

                continue;
            }

            $role = $project->roleFor($user);

            $tasks = $project->tasks()->where('assigned_to', $user->id)->get();
            $resettable = $tasks->whereNotIn('status', ['done', 'submitted', 'in_review']);
            $frozen = $tasks->whereIn('status', ['done', 'submitted', 'in_review']);

            if ($resettable->isNotEmpty()) {
                $project->tasks()->whereIn('id', $resettable->pluck('id'))->update([
                    'assigned_to' => null,
                    'status' => 'todo',
                ]);
            }

            if ($frozen->isNotEmpty()) {
                $project->tasks()->whereIn('id', $frozen->pluck('id'))->update([
                    'pending_resolution' => true,
                ]);
            }

            Comment::where('user_id', $user->id)
                ->whereIn('task_id', $resettable->pluck('id'))
                ->delete();

            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', $user->id)
                ->get();

            $frozenCount = $frozen->count();
            $frozenNote = $frozenCount > 0
                ? ($frozenCount === 1
                    ? ' 1 of their tasks is frozen pending your decision — resolve it from the project page before it can move again.'
                    : " {$frozenCount} of their tasks are frozen pending your decision — resolve them from the project page before they can move again.")
                : '';

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    $notification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'causer_id' => $user->id,
                        'message' => "Account deletion requested\n**{$user->name}** (**{$role}**) requested to delete their account.{$frozenNote} They'll remain a member of \"**{$project->name}**\" for now — if they don't restore their account by the end of **" . $graceEndsAt->format('M j, Y') . "**, they'll be removed from the project automatically.",
                        'url' => route('projects.show', $project->id, false),
                    ]);

                    try {
                        broadcast(new MemberLeftProject($recipient->id, $user->name, $role ?? 'member', $project, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            }
        }

        $user->delete();

        return $graceEndsAt;
    }

    /**
     * Permanently removes an account for real: notifies members of any project the
     * user owns (those projects cascade-delete the instant forceDelete() below runs,
     * via projects.owner_id's onDelete('cascade') FK), releases their task assignments
     * in every project they don't own, and then forceDelete()s the row. Two callers:
     *
     *  - The scheduled `accounts:purge-deleted` sweep, for accounts whose grace period
     *    already ran out. These were already unwound via unwindProjectsAndDelete() when
     *    first soft-deleted, so only $onlyPendingTasks-scoped (frozen) tasks remain to
     *    release — pass $onlyPendingTasks: true (the default).
     *  - An admin choosing "delete permanently" on a still-active account, which skips
     *    the grace period entirely. Nothing has been unwound yet, so every task assigned
     *    to the user needs releasing in one pass — pass $onlyPendingTasks: false.
     */
    public static function purgeNow(User $user, bool $onlyPendingTasks = true): void
    {
        self::notifyOwnedProjectMembers($user);
        self::releaseAssignedTasks($user, $onlyPendingTasks);
        $user->forceDelete();
    }

    /**
     * Projects this user owned are about to cascade-delete along with them (see
     * purgeNow() above) — give their remaining members a heads-up before that happens,
     * not after, since there's nothing left to query once forceDelete() runs.
     */
    private static function notifyOwnedProjectMembers(User $user): void
    {
        $ownedProjects = Project::where('owner_id', $user->id)->get();

        foreach ($ownedProjects as $project) {
            $recipients = $project->members()->where('users.id', '!=', $user->id)->get();

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'project_deleted')) {
                    $notification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'project_deleted',
                        'message' => "Project deleted\n\"**{$project->name}**\" was permanently deleted — its owner's account was permanently deleted",
                        'url' => route('projects.index', [], false),
                    ]);

                    try {
                        broadcast(new ProjectDeleted($recipient->id, $project->name, $project->id, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $recipient,
                    'project.deleted',
                    "{$project->name} was deleted",
                    [
                        "The project \"**{$project->name}**\" (#{$project->id}) you were a member of has been permanently deleted.",
                        "Its owner's account was permanently deleted, and it went with it.",
                    ],
                );
            }
        }
    }

    /**
     * Releases the user's task assignments in every project they don't own (owned
     * projects cascade-delete separately, see notifyOwnedProjectMembers() above) and
     * lets the project's owner/manager know. When $onlyPendingTasks is true, only tasks
     * already frozen with pending_resolution=true are touched (used by the scheduled
     * sweep, where everything else was already reset back when the account was first
     * soft-deleted); otherwise every task currently assigned to the user is released in
     * one pass, since nothing has been unwound yet.
     */
    private static function releaseAssignedTasks(User $user, bool $onlyPendingTasks): void
    {
        $query = Task::where('assigned_to', $user->id);
        if ($onlyPendingTasks) {
            $query->where('pending_resolution', true);
        }
        $tasks = $query->get()->groupBy('project_id');

        foreach ($tasks as $projectId => $projectTasks) {
            $project = Project::find($projectId);
            if (! $project || $project->owner_id === $user->id) {
                continue; // guards against a race with the project itself being deleted, and owned projects are handled above
            }

            $taskIds = $projectTasks->pluck('id');

            Task::whereIn('id', $taskIds)->update([
                'assigned_to' => null,
                'status' => 'todo',
                'pending_resolution' => false,
            ]);

            if (! $onlyPendingTasks) {
                Comment::where('user_id', $user->id)->whereIn('task_id', $taskIds)->delete();
            }

            $count = $projectTasks->count();
            $taskWord = $count === 1 ? 'task' : 'tasks';

            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', $user->id)
                ->get();

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    $notification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'causer_id' => $user->id,
                        'message' => "Account permanently deleted\n**{$user->name}**'s account is now gone for good — **{$count}** {$taskWord} in \"**{$project->name}**\" that were assigned to them have been released back to Todo, unassigned",
                        'url' => route('projects.show', $project->id, false),
                    ]);

                    try {
                        broadcast(new MemberLeftProject($recipient->id, $user->name, $project->roleFor($user) ?? 'member', $project, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $recipient,
                    'project.member_left',
                    "{$user->name}'s account was permanently deleted",
                    [
                        "**{$user->name}** was a member of \"**{$project->name}**\" (#{$project->id}) and their account has now been permanently deleted.",
                        "{$count} {$taskWord} assigned to them have been automatically unassigned and reset to Todo.",
                    ],
                    route('projects.show', $project->id),
                    'View Project'
                );
            }
        }
    }
}
