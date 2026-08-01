<?php

namespace App\Console\Commands;

use App\Events\ProjectDeleted;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Console\Command;

class PurgeDeletedAccounts extends Command
{
    protected $signature = 'accounts:purge-deleted';
    protected $description = 'Permanently deletes accounts whose post-deletion grace period has ended.';

    public function handle(): void
    {
        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);

        $expired = User::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays($graceDays))
            ->get();

        foreach ($expired as $user) {
            $this->notifyOwnedProjectMembers($user);
            $this->releaseLeftoverPendingTasks($user);

            // forceDelete() removes the row for real; this is what cascades/nulls
            // out everything still hanging off it at the DB level (owned projects,
            // task assignments, notifications, activity logs, etc.) — the same
            // relationships confirmDeletion() already unwound at the app level
            // when the deletion was first confirmed. Both notification passes
            // above must run first: there's nothing left to query afterwards.
            $user->forceDelete();
        }

        if ($expired->count() > 0) {
            $this->info("Permanently deleted {$expired->count()} account(s) past their {$graceDays}-day grace period.");
        }
    }

    /**
     * Projects this user owned were deliberately left untouched during the
     * grace period (see AccountController::confirmDeletion()) — but they
     * cascade-delete along with the owner right now, so their remaining
     * members need to hear about it before that happens, not after.
     */
    private function notifyOwnedProjectMembers(User $user): void
    {
        $ownedProjects = Project::where('owner_id', $user->id)->get();

        foreach ($ownedProjects as $project) {
            $recipients = $project->members()->where('users.id', '!=', $user->id)->get();

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'project_deleted')) {
                    $notification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'project_deleted',
                        'message' => "Project deleted\n\"**{$project->name}**\" was permanently deleted — its owner's account was never restored",
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
                        "Its owner deleted their account and it was never restored within the grace period, so the project went with it.",
                    ],
                );
            }
        }
    }

    /**
     * Projects this user didn't own kept their membership row intact through the
     * grace period (see AccountDeletion::unwindProjectsAndDelete()) — forceDelete()
     * below cascades that away for real via project_user's onDelete('cascade') FK, so
     * nothing needs to happen to it here. But any of their tasks that were frozen
     * (pending_resolution) rather than reset are still sitting assigned to them. The
     * forceDelete() FK (`assigned_to` => set null) would silently blank the assignee
     * and leave pending_resolution stuck true forever, so release those back to the
     * backlog properly here and let the project's owner/manager know it happened.
     */
    private function releaseLeftoverPendingTasks(User $user): void
    {
        $tasks = Task::where('assigned_to', $user->id)
            ->where('pending_resolution', true)
            ->get()
            ->groupBy('project_id');

        foreach ($tasks as $projectId => $projectTasks) {
            $project = Project::find($projectId);
            if (! $project) {
                continue; // guards against a race with the project itself being deleted
            }

            Task::whereIn('id', $projectTasks->pluck('id'))->update([
                'assigned_to' => null,
                'status' => 'todo',
                'pending_resolution' => false,
            ]);

            $count = $projectTasks->count();
            $taskWord = $count === 1 ? 'task' : 'tasks';

            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->get();

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'message' => "Account permanently deleted\n**{$user->name}**'s account is now gone for good — {$count} pending {$taskWord} in \"**{$project->name}**\" that were awaiting your decision have been released back to Todo, unassigned",
                        'url' => route('projects.show', $project->id, false),
                    ]);
                }

                NotificationMailer::send(
                    $recipient,
                    'project.member_left',
                    "{$user->name}'s account was permanently deleted",
                    [
                        "**{$user->name}** was a member of \"**{$project->name}**\" (#{$project->id}) and their account has now been permanently deleted.",
                        "{$count} pending {$taskWord} that were awaiting your decision (from Resolve Pending) have been automatically unassigned and reset to Todo.",
                    ],
                    route('projects.show', $project->id),
                    'View Project'
                );
            }
        }
    }
}
