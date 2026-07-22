<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SynkroNotificationMail;
use App\Models\AdminLog;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class FeedbackAdminController extends Controller
{
    public function index(Request $request)
    {
        $feedbacks = Feedback::with(['responses.admin', 'attachments'])
            ->when($request->category, fn ($q) => $q->where('category', $request->category))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('tracking_id', 'like', "%{$request->search}%")
                    ->orWhere('subject', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Feedbacks', [
            'feedbacks' => $feedbacks,
            'filters' => $request->only(['category', 'status', 'search']),
        ]);
    }

    /**
     * Combines what used to be two separate actions (updateStatus + respond) into one, so
     * a status change and a message are always sent to the submitter as a single email
     * instead of two back-to-back ones for what's really one action on the admin's part.
     * A message is required even when the status isn't changing, so every update always
     * has something worth emailing about.
     */
    public function update(Request $request, Feedback $feedback)
    {
        $wasClosed = in_array($feedback->status, ['closed', 'rejected']);

        $validated = $request->validate([
            'status' => 'required|in:pending,reviewing,accepted,rejected,closed',
            'message' => 'required|string|max:2000',
        ]);

        $stillClosed = in_array($validated['status'], ['closed', 'rejected']);
        if ($wasClosed && $stillClosed) {
            return back()->withErrors(['message' => 'This ticket is closed. Reopen it (change the status) to respond.']);
        }

        $oldStatus = $feedback->status;
        $statusChanged = $oldStatus !== $validated['status'];

        $feedback->update(['status' => $validated['status']]);

        FeedbackResponse::create([
            'message' => $validated['message'],
            'feedback_id' => $feedback->id,
            'admin_id' => Auth::id(),
            'sender_type' => 'admin',
        ]);

        if ($statusChanged) {
            \App\Support\AdminAlerts::broadcastRefresh();

            AdminLog::log('ticket.status_changed', "Changed ticket {$feedback->tracking_id} status from {$oldStatus} to {$validated['status']} and responded", $feedback);
        } else {
            AdminLog::log('ticket.responded', "Responded to ticket {$feedback->tracking_id} (\"{$feedback->subject}\")", $feedback);
        }

        $lines = $statusChanged
            ? ["The status of your ticket \"{$feedback->subject}\" has been updated, and support added a message:"]
            : ["Support responded to your ticket \"{$feedback->subject}\":"];

        if ($statusChanged && $validated['status'] === 'closed') {
            $lines[] = 'If you have further questions, you can reopen it from the tracking page.';
        }

        $this->notifySubmitter(
            $feedback,
            $statusChanged
                ? "Ticket updated ({$feedback->tracking_id})"
                : "Support replied to your ticket ({$feedback->tracking_id})",
            $lines,
            highlight: [
                'label' => $statusChanged ? 'Status: '.ucfirst($validated['status']) : null,
                'content' => \App\Support\NoteFormatter::toHtml($validated['message']),
                'html' => true,
            ],
        );

        return back()->with('success', 'Ticket updated.');
    }

    /**
     * Feedback submitters are guests (not registered users), so there's no per-user
     * preference to check here; this always sends.
     */
    private function notifySubmitter(Feedback $feedback, string $subject, array $lines, ?array $highlight = null): void
    {
        try {
            Mail::to($feedback->email)->queue(
                new SynkroNotificationMail(
                    $feedback->name,
                    $subject,
                    $lines,
                    url(route('feedback.page', [], false)),
                    'Track Your Ticket',
                    $highlight,
                    footerNote: 'This email was generated automatically. Please do not reply directly; use the button above to continue the conversation on your ticket.',
                )
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }
}