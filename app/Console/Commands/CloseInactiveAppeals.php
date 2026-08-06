<?php

namespace App\Console\Commands;

use App\Events\AppealAutoClosed;
use App\Models\AdminLog;
use App\Models\SuspensionAppeal;
use App\Models\UserNotification;
use App\Support\NotificationPreferences;
use App\Support\NoteFormatter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Appeal counterpart to CloseInactiveFeedback. Appeals don't have a two-way
 * response thread the way tickets do (the appellant only ever sends one
 * message — the original appeal), so "a supporter has responded" here means
 * an admin used respondAppeal() to leave an interim note without deciding
 * it yet. An appeal nobody has looked at is a support backlog problem, not
 * something that should silently vanish on the person waiting on it — same
 * reasoning as CloseInactiveFeedback's whereHas('responses') guard.
 */
class CloseInactiveAppeals extends Command
{
    protected $signature = 'appeals:close-inactive';

    protected $description = 'Auto-close pending suspension appeals inactive for 24h following a note from support';

    private const REASON = 'This appeal was automatically closed after 24 hours of inactivity following a note '
        .'from our support team. If you still need help, you can submit a new appeal from the login screen.';

    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $candidates = SuspensionAppeal::where('status', 'pending')
            ->whereHas('responses')
            ->with(['responses', 'user'])
            ->get();

        $closed = 0;

        foreach ($candidates as $appeal) {
            $lastResponseAt = $appeal->responses->max('created_at');

            if (! $lastResponseAt || $lastResponseAt->gt($cutoff)) {
                continue;
            }

            DB::transaction(function () use ($appeal) {
                $appeal->update([
                    'status' => 'reviewed',
                    'outcome' => 'closed',
                    'admin_reason' => self::REASON,
                    'auto_resolved' => true,
                ]);
            });

            AdminLog::log(
                'appeal.auto_closed',
                "Auto-closed {$appeal->user?->name}'s suspension appeal after 24h of inactivity",
                $appeal,
                self::REASON
            );

            $this->notify($appeal);

            $closed++;
        }

        $this->info("Auto-closed {$closed} inactive appeal(s).");

        return self::SUCCESS;
    }

    private function notify(SuspensionAppeal $appeal): void
    {
        if (! $appeal->user) {
            return;
        }

        // Signed rather than a plain login link: closing doesn't necessarily mean
        // the suspension itself was lifted, so "Log In" could easily be a dead
        // end - same reasoning as AdminController::respondAppeal().
        $historyUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'appeal.history',
            now()->addDays(30),
            ['user' => $appeal->user->id, 'note' => "appeal:{$appeal->id}"]
        );

        \App\Support\NotificationMailer::send(
            $appeal->user,
            'account.appeal_auto_closed',
            'Your suspension appeal was closed',
            ['Your suspension appeal was automatically closed after 24 hours of inactivity following a note from our support team.'],
            $historyUrl,
            'View Details',
            highlight: [
                'label' => 'Reason',
                'content' => NoteFormatter::toHtml(self::REASON),
                'html' => true,
            ],
        );

        if (! NotificationPreferences::wantsType($appeal->user, 'appeal_auto_closed')) {
            return;
        }

        $notification = UserNotification::create([
            'user_id' => $appeal->user->id,
            'type' => 'appeal_auto_closed',
            'message' => "Appeal closed\nYour suspension appeal was automatically closed after **24h** of inactivity.",
            'url' => $historyUrl,
        ]);

        try {
            broadcast(new AppealAutoClosed($appeal->user->id, $appeal->id, $notification->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
