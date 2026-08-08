<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Support\NotificationMailer;
use Illuminate\Console\Command;

class PurgeDeletedProjects extends Command
{
    protected $signature = 'projects:purge-deleted';
    protected $description = 'Permanently deletes trashed projects whose grace period has ended.';

    public function handle(): void
    {
        $graceDays = (int) config('synkro.project_deletion_grace_days', 7);

        $expired = Project::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays($graceDays))
            ->get();

        foreach ($expired as $project) {
            $projectName = $project->name;
            $projectId = $project->id;

            // Members were already told the project was moved to the trash when it was
            // first deleted (see ProjectController::confirmDeletion()) - this is a
            // second, distinct notice that the grace period ran out and it's gone for
            // good now, not just a repeat of the earlier one.
            $recipients = $project->members()->where('users.id', '!=', $project->owner_id)->get();

            foreach ($recipients as $recipient) {
                NotificationMailer::send(
                    $recipient,
                    'project.deleted',
                    "{$projectName} was permanently deleted",
                    ["The project \"**{$projectName}**\" (#{$projectId}) you were a member of has passed its **{$graceDays}-day** trash grace period and been permanently deleted."],
                );
            }

            // forceDelete() removes the row for real; the tasks table's onDelete('cascade')
            // FK (and every other table hanging off project_id/task_id) cascades the rest
            // away at the DB level, the same way it already does for a project deleted
            // directly - no separate task purge needed here even though tasks were
            // independently soft-deleted alongside this project (see Project::booted()).
            $project->forceDelete();
        }

        if ($expired->count() > 0) {
            $this->info("Permanently deleted {$expired->count()} project(s) past their {$graceDays}-day trash grace period.");
        }
    }
}
