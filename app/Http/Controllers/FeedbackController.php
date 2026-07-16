<?php

namespace App\Http\Controllers;

use App\Mail\SynkroNotificationMail;
use App\Models\Feedback;
use App\Models\User;
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
                    url(route('admin.feedbacks', [], false)),
                    'View Ticket',
                    highlight: ['label' => $feedback->subject, 'content' => $feedback->message],
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /** Admins can now opt out of this via Settings → Email Notifications → Admin Alerts. */
    private function notifyAdmins(Feedback $feedback, string $message): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            if (! \App\Support\EmailPreferences::wants($admin, 'admin.ticket_reply')) {
                continue;
            }

            try {
                Mail::to($admin->email)->queue(new SynkroNotificationMail(
                    $admin->name,
                    "New message on ticket ({$feedback->tracking_id})",
                    [
                        "{$feedback->name} replied to their ticket \"{$feedback->subject}\":",
                        $message,
                    ],
                    url(route('admin.feedbacks', [], false)),
                    'View Ticket'
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }
}