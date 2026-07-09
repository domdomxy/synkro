<?php

namespace App\Console\Commands;

use App\Events\ReminderDue;
use App\Models\Reminder;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use Illuminate\Console\Command;

class SendDueReminders extends Command
{
    protected $signature = 'reminders:send';
    protected $description = 'Send notifications for due reminders';

    public function handle(): void
    {
        $due = Reminder::where('dismissed', false)
            ->whereNull('notified_at')
            ->where('remind_at', '<=', now())
            ->with('user')
            ->get();

        foreach ($due as $reminder) {
            $notification = UserNotification::create([
                'user_id' => $reminder->user_id,
                'type' => 'reminder',
                'message' => "⏰ {$reminder->title}" . ($reminder->note ? " — {$reminder->note}" : ''),
                'url' => route('dashboard', [], false),
            ]);

            try {
                broadcast(new ReminderDue(
                    $reminder->user_id,
                    $reminder->title,
                    $reminder->note,
                    $notification->id
                ));
            } catch (\Throwable $e) {
                report($e);
            }

            if ($reminder->user) {
                NotificationMailer::send(
                    $reminder->user,
                    'reminders.due',
                    "Reminder: {$reminder->title}",
                    [$reminder->note ? "{$reminder->title} — {$reminder->note}" : $reminder->title],
                    url(route('dashboard', [], false)),
                    'View Dashboard'
                );
            }

            $reminder->update(['notified_at' => now(), 'dismissed' => true]);
        }

        $this->info("Sent {$due->count()} reminder notifications.");
    }
}