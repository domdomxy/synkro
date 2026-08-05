<?php

namespace App\Console\Commands;

use App\Events\TicketStatusChanged;
use App\Mail\SynkroNotificationMail;
use App\Models\AdminLog;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\NoteFormatter;
use App\Support\NotificationPreferences;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Mirrors LiftExpiredSuspensions in spirit: a quiet housekeeping sweep rather
 * than something a person triggers. A ticket only qualifies once support has
 * actually weighed in at least once (a never-answered ticket sitting for 24h
 * is a support backlog problem, not something that should vanish on the
 * submitter) — see the whereHas() below.
 */
class CloseInactiveFeedback extends Command
{
    protected $signature = 'feedback:close-inactive';

    protected $description = 'Auto-close feedback tickets that have had no activity for 24h following a support reply';

    private const REASON = 'This ticket was automatically closed after 24 hours of inactivity following a response '
        .'from our support team. If you still need help, you can reopen it from the tracking page or start a new ticket.';

    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $candidates = Feedback::whereNotIn('status', ['closed', 'rejected'])
            ->whereHas('responses', fn ($q) => $q->where('sender_type', 'admin'))
            ->with('responses')
            ->get();

        $closed = 0;

        foreach ($candidates as $feedback) {
            // Last activity is whichever is more recent: the ticket row itself (touched
            // whenever an admin changes its status) or the newest response in the thread
            // (a submitter's reply doesn't touch the parent row, only the response table).
            $lastResponseAt = $feedback->responses->max('created_at');
            $lastActivity = $lastResponseAt && $lastResponseAt->gt($feedback->updated_at)
                ? $lastResponseAt
                : $feedback->updated_at;

            if ($lastActivity->gt($cutoff)) {
                continue;
            }

            $feedback->update(['status' => 'closed']);

            FeedbackResponse::create([
                'feedback_id' => $feedback->id,
                'admin_id' => null,
                'sender_type' => 'system',
                'message' => self::REASON,
            ]);

            AdminLog::log(
                'ticket.auto_closed',
                "Auto-closed ticket {$feedback->tracking_id} (\"{$feedback->subject}\") after 24h of inactivity",
                $feedback,
                self::REASON
            );

            $this->notifyEmail($feedback);
            $this->notifyInApp($feedback);

            $closed++;
        }

        $this->info("Auto-closed {$closed} inactive ticket(s).");

        return self::SUCCESS;
    }

    /** Feedback submitters are guests by default — this always sends, same as FeedbackAdminController::notifySubmitter. */
    private function notifyEmail(Feedback $feedback): void
    {
        try {
            Mail::to($feedback->email)->queue(
                new SynkroNotificationMail(
                    $feedback->name,
                    "Ticket closed due to inactivity ({$feedback->tracking_id})",
                    ["Your ticket \"**{$feedback->subject}**\" has been automatically closed after 24 hours of inactivity following our last reply."],
                    url(route('feedback.page', [], false)),
                    'Track Your Ticket',
                    [
                        'label' => 'Reason',
                        'content' => NoteFormatter::toHtml(self::REASON),
                        'html' => true,
                    ],
                    footerNote: 'This email was generated automatically. Please do not reply directly; use the button above to continue the conversation on your ticket.',
                )
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Only fires if the submitter's email happens to belong to a registered account, same as the admin-reply path. */
    private function notifyInApp(Feedback $feedback): void
    {
        $user = User::where('email', $feedback->email)->first();

        if (! $user || ! NotificationPreferences::wantsType($user, 'ticket_status_changed')) {
            return;
        }

        $notification = UserNotification::create([
            'user_id' => $user->id,
            'type' => 'ticket_status_changed',
            'message' => "Ticket auto-closed\nYour ticket \"**{$feedback->subject}**\" ({$feedback->tracking_id}) was automatically closed after **24h** of inactivity.",
            'url' => route('feedback.page', [], false),
        ]);

        try {
            broadcast(new TicketStatusChanged($user->id, $feedback->tracking_id, $feedback->subject, 'closed', $notification->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
