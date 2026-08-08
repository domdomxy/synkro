<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Support\NotificationMailer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeDeletedTasks extends Command
{
    protected $signature = 'tasks:purge-deleted';
    protected $description = 'Permanently deletes trashed tasks whose grace period has ended.';

    public function handle(): void
    {
        $graceDays = (int) config('synkro.task_deletion_grace_days', 7);

        // Only independently-trashed tasks (project still active) - a task cascade-trashed
        // alongside its own project (see Project::booted()) is purged when that project is,
        // by projects:purge-deleted, not here - querying it again would just forceDelete()
        // a row that command is about to (or already did) remove via its cascading FK.
        $expired = Task::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays($graceDays))
            ->whereHas('project', fn ($query) => $query->whereNull('deleted_at'))
            ->with('project', 'assignee', 'deliverables')
            ->get();

        foreach ($expired as $task) {
            $taskTitle = $task->title;

            if ($task->assigned_to && $task->assignee && $task->project->isMember($task->assignee)) {
                // Same reasoning as PurgeDeletedProjects: a distinct "grace period ran
                // out" notice, separate from the "moved to trash" one already sent when
                // TaskController::destroy() first trashed it.
                NotificationMailer::send(
                    $task->assignee,
                    'task.deleted',
                    "Task permanently deleted: {$taskTitle}",
                    ["The task \"**{$taskTitle}**\" you were assigned to in \"**{$task->project->name}**\" (#{$task->project_id}) has passed its **{$graceDays}-day** trash grace period and been permanently deleted."],
                );
            }

            foreach ($task->deliverables as $deliverable) {
                Storage::disk('public')->delete($deliverable->path);
            }

            $task->forceDelete();
        }

        if ($expired->count() > 0) {
            $this->info("Permanently deleted {$expired->count()} task(s) past their {$graceDays}-day trash grace period.");
        }
    }
}
