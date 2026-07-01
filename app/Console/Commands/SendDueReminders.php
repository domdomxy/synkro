<?php

namespace App\Console\Commands;

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
            UserNotification::create([
                'user_id' => $reminder->user_id,
                'type' => 'reminder',
                'message' => "⏰ {$reminder->title}" . ($reminder->note ? " — {$reminder->note}" : ''),
                'url' => route('dashboard', [], false),
            ]);

            $reminder->update(['notified_at' => now(), 'dismissed' => true]);
        }

        $this->info("Sent {$due->count()} reminder notifications.");
    }
}