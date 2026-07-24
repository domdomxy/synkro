<?php

namespace App\Console\Commands;

use App\Events\TaskOverdue;
use App\Models\Task;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Console\Command;

class SendOverdueTaskAlerts extends Command
{
    protected $signature = 'tasks:notify-overdue';
    protected $description = 'Notify assignees once when their task passes its due date without being done';

    public function handle(): void
    {
        $overdue = Task::where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereNotNull('assigned_to')
            ->whereNull('overdue_notified_at')
            ->where('due_date', '<=', now())
            ->with('assignee', 'project')
            ->get();

        foreach ($overdue as $task) {
            $assignee = $task->assignee;

            if ($assignee && NotificationPreferences::wantsType($assignee, 'task_overdue')) {
                $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

                $notification = UserNotification::create([
                    'user_id' => $assignee->id,
                    'type' => 'task_overdue',
                    'message' => "Task overdue\n\"{$task->title}\" is past its due date",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskOverdue($assignee->id, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }

                NotificationMailer::send(
                    $assignee,
                    'task.overdue',
                    "Overdue: {$task->title}",
                    ["\"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id}) is now past its due date."],
                    url($url),
                    'View Task'
                );
            }

            // Set regardless of whether a notification was actually sent (e.g. preference
            // off, or no assignee-linked mail) so we don't re-check this task every minute.
            $task->update(['overdue_notified_at' => now()]);
        }

        $this->info("Sent {$overdue->count()} overdue task alert(s).");
    }
}
