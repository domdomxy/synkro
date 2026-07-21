<?php

namespace App\Http\Controllers;

use App\Events\FeedbackReplied;
use App\Mail\SynkroNotificationMail;
use App\Models\Feedback;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'category' => 'required|in:bug,help,report,question,suggestion,other',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
            'attachments' => 'nullable|array|max:5',
            'attachments.*' => 'image|max:4096',
        ]);

        $feedback = Feedback::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
        ]);

        foreach ($request->file('attachments', []) as $file) {
            $feedback->attachments()->create([
                'path' => $file->store('feedback-attachments', 'public'),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
        }

        $this->notifyAdminsNewTicket($feedback);
        $this->notifySubmitterNewTicket($feedback);

        \App\Support\AdminAlerts::broadcastRefresh();

        return redirect()->route('feedback.page')
            ->with('feedback_tracking_id', $feedback->tracking_id);
    }

    public function track(Request $request)
    {
        $validated = $request->validate([
            'tracking_id' => 'required|string',
        ]);

        $feedback = Feedback::with(['responses.admin', 'attachments'])
            ->where('tracking_id', strtoupper(trim($validated['tracking_id'])))
            ->first();

        return response()->json($feedback
            ? ['found' => true, 'feedback' => $feedback]
            : ['found' => false]
        );
    }

    public function reply(Request $request)
    {
        $request->validate([
            'tracking_id' => 'required|string',
            'email' => 'required|email',
            'message' => 'required|string|max:2000',
        ]);

        $feedback = Feedback::where('tracking_id', $request->tracking_id)
            ->where('email', $request->email)
            ->first();

        if (! $feedback) {
            return response()->json(['error' => 'Feedback not found.'], 404);
        }

        if (in_array($feedback->status, ['closed', 'rejected'])) {
            return response()->json(['error' => 'This ticket is closed and no longer accepts replies.'], 422);
        }

        $hasAdminResponse = $feedback->responses()->where('sender_type', 'admin')->exists();
        if (! $hasAdminResponse) {
            return response()->json(['error' => 'You can reply once our team has responded to this ticket.'], 422);
        }

        $response = $feedback->responses()->create([
            'sender_type' => 'user',
            'message' => $request->message,
        ]);

        $this->notifyAdmins($feedback, $request->message);

        return response()->json(['success' => true, 'response' => $response]);
    }

    public function close(Request $request)
    {
        $request->validate([
            'tracking_id' => 'required|string',
            'email' => 'required|email',
        ]);

        $feedback = Feedback::where('tracking_id', $request->tracking_id)
            ->where('email', $request->email)
            ->first();

        if (! $feedback) {
            return response()->json(['error' => 'Feedback not found.'], 404);
        }

        if (in_array($feedback->status, ['closed', 'rejected'])) {
            return response()->json(['error' => 'This ticket is already closed.'], 422);
        }

        $feedback->update(['status' => 'closed']);

        return response()->json(['success' => true, 'status' => 'closed']);
    }

    public function reopen(Request $request)
    {
        $request->validate([
            'tracking_id' => 'required|string',
            'email' => 'required|email',
        ]);

        $feedback = Feedback::where('tracking_id', $request->tracking_id)
            ->where('email', $request->email)
            ->first();

        if (! $feedback) {
            return response()->json(['error' => 'Feedback not found.'], 404);
        }

        if ($feedback->status !== 'closed') {
            return response()->json(['error' => 'Only closed tickets can be reopened.'], 422);
        }

        $feedback->update(['status' => 'pending']);

        return response()->json(['success' => true, 'status' => 'pending']);
    }

    /**
     * Deep-links to one ticket on the admin feedback list. Reuses the existing search filter
     * (which already matches tracking_id) so the ticket is guaranteed to be on page 1 even
     * with pagination; the frontend then scrolls to and highlights #ticket-{id} on load.
     */
    private function adminFeedbackUrl(Feedback $feedback): string
    {
        return url(route('admin.feedbacks', ['ticket' => $feedback->id, 'search' => $feedback->tracking_id], false));
    }

    /**
     * Confirms receipt to the person who submitted the ticket, with their tracking ID.
     * Guests aren't registered users (no email_preferences row to check), so — same as
     * FeedbackAdminController::notifySubmitter() for status-change/reply emails — this
     * always sends unconditionally rather than going through EmailPreferences::wants(),
     * which would incorrectly return false for an email with no matching User account.
     */
    private function notifySubmitterNewTicket(Feedback $feedback): void
    {
        try {
            Mail::to($feedback->email)->queue(new SynkroNotificationMail(
                $feedback->name,
                "We've received your ticket ({$feedback->tracking_id})",
                [
                    "Thanks for reaching out! We've received your {$feedback->category} ticket \"{$feedback->subject}\" and will get back to you soon.",
                    "Your tracking ID is {$feedback->tracking_id} — use it on the tracking page to follow this ticket's status or add replies.",
                ],
                url(route('feedback.page', [], false)),
                'Track Your Ticket',
                footerNote: 'This email was generated automatically. Please do not reply directly; use the button above to continue the conversation on your ticket.',
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /** Admins can opt out via Settings → Email Notifications → Admin Alerts. */
    private function notifyAdminsNewTicket(Feedback $feedback): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            if (! \App\Support\EmailPreferences::wants($admin, 'admin.ticket_created')) {
                continue;
            }

            try {
                Mail::to($admin->email)->queue(new SynkroNotificationMail(
                    $admin->name,
                    "New ticket submitted ({$feedback->tracking_id})",
                    ["{$feedback->name} submitted a new {$feedback->category} ticket:"],
                    $this->adminFeedbackUrl($feedback),
                    'View Ticket',
                    highlight: ['label' => $feedback->subject, 'content' => \App\Support\NoteFormatter::toHtml($feedback->message), 'html' => true],
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /**
     * When a user replies, only notify admins who have already responded on THIS ticket,
     * not every admin platform-wide — once an admin has replied, they're effectively the
     * one handling the conversation, and follow-ups should go back to them, not the whole
     * team. (A brand-new ticket with no admin response yet still goes to every admin via
     * notifyAdminsNewTicket() above — nobody is "handling" it yet at that point.)
     */
    private function notifyAdmins(Feedback $feedback, string $message): void
    {
        $admins = $feedback->responses()
            ->where('sender_type', 'admin')
            ->with('admin')
            ->get()
            ->pluck('admin')
            ->filter()
            ->unique('id');

        $url = $this->adminFeedbackUrl($feedback);

        foreach ($admins as $admin) {
            // In-app bell notification: now gated on the admin's 'administration'
            // NotificationPreferences category (previously always created regardless
            // of the in-app toggle; email preferences below are unaffected either way).
            if (NotificationPreferences::wantsType($admin, 'feedback_replied')) {
                $notification = UserNotification::create([
                    'user_id' => $admin->id,
                    'type' => 'feedback_replied',
                    'message' => "Feedback reply\n{$feedback->name} replied to ticket \"{$feedback->subject}\"",
                    'url' => $url,
                ]);

                try {
                    broadcast(new FeedbackReplied($admin->id, $feedback->tracking_id, $feedback->subject, $feedback->name, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            if (! \App\Support\EmailPreferences::wants($admin, 'admin.ticket_reply')) {
                continue;
            }

            try {
                Mail::to($admin->email)->queue(new SynkroNotificationMail(
                    $admin->name,
                    "New message on ticket ({$feedback->tracking_id})",
                    ["{$feedback->name} replied to their ticket \"{$feedback->subject}\":"],
                    $url,
                    'View Ticket',
                    highlight: ['label' => null, 'content' => \App\Support\NoteFormatter::toHtml($message), 'html' => true],
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }
}