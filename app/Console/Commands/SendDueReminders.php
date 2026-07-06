<?php

namespace App\Console\Commands;

use App\Events\ReminderDue;
use App\Models\Reminder;
use App\Models\UserNotification;
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

            $reminder->update(['notified_at' => now(), 'dismissed' => true]);
        }

        $this->info("Sent {$due->count()} reminder notifications.");
    }
}