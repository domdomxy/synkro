<?php

namespace App\Support;

use App\Models\Comment;
use App\Models\User;
use App\Models\UserNotification;
use App\Events\OwnerAccountDeleted;
use App\Events\MemberLeftProject;
use Carbon\Carbon;

class AccountDeletion
{
    /**
     * Unwinds a user's project memberships (freezing in-review/done tasks pending
     * resolution, resetting the rest, notifying owners/managers) and soft-deletes the
     * account. Shared by the self-service deletion flow (AccountController::confirmDeletion,
     * reached via a signed email link) and admin-forced deletion (AdminController::destroy/
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
                            'message' => "Owner account deleted\n**{$user->name}**, the owner of \"**{$project->name}**\", deleted their account. The project itself is unaffected for now, but it's worth exporting anything you need — if they don't restore their account by the end of " . $graceEndsAt->format('M j, Y') . ', it and everything in it will be gone for good.',
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
                            "**{$user->name}**, the owner of \"**{$project->name}**\" (#{$project->id}), deleted their account.",
                            "The project stays exactly as it is for now. If they don't restore their account by the end of " . $graceEndsAt->format('M j, Y') . ", the project and everything in it will be permanently deleted along with it — you may want to export anything you need before then.",
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

            $project->members()->detach($user->id);

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
                        'message' => "Member left\n**{$user->name}** ({$role}) deleted their account.{$frozenNote}",
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
}
