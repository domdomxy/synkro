<?php

namespace App\Console\Commands;

use App\Events\TaskReminderDue;
use App\Models\Task;
use App\Models\UserNotification;
use App\Support\DurationFormatter;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Console\Command;

class SendTaskDeadlineReminders extends Command
{
    protected $signature = 'tasks:notify-deadline-reminders';
    protected $description = "Notify assignees once a task's configured reminder offset before its due date is reached";

    public function handle(): void
    {
        // reminder_offset_minutes is owner/manager-configured per task (see
        // TaskController::update() / Task::reminderIsLocked()). Fires once the
        // window opens (due_date - offset <= now) and hasn't already fired for
        // this due_date/offset pair - reminder_notified_at is cleared whenever
        // either changes, same pattern as overdue_notified_at.
        $due = Task::where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereNotNull('assigned_to')
            ->whereNotNull('reminder_offset_minutes')
            ->whereNull('reminder_notified_at')
            ->whereRaw('DATE_SUB(due_date, INTERVAL reminder_offset_minutes MINUTE) <= ?', [now()])
            ->with('assignee', 'project')
            ->get();

        foreach ($due as $task) {
            $assignee = $task->assignee;

            if ($assignee && $task->project->isMember($assignee) && NotificationPreferences::wantsType($assignee, 'task_reminder')) {
                $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
                $offset = DurationFormatter::humanize($task->reminder_offset_minutes);

                $notification = UserNotification::create([
                    'user_id' => $assignee->id,
                    'type' => 'task_reminder',
                    'message' => "Deadline approaching\n\"**{$task->title}**\" is due soon",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskReminderDue($assignee->id, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }

                NotificationMailer::send(
                    $assignee,
                    'task.reminder',
                    "Coming up: {$task->title}",
                    ["\"**{$task->title}**\" in the project \"**{$task->project->name}**\" (#{$task->project_id}) is due soon ({$offset})."],
                    url($url),
                    'View Task'
                );
            }

            // Set regardless of whether a notification was actually sent (e.g. preference
            // off) so we don't re-check this task every run.
            $task->update(['reminder_notified_at' => now()]);
        }

        $this->info("Sent {$due->count()} deadline reminder(s).");
    }
}
