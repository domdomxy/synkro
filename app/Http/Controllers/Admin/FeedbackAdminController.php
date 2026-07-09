<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SynkroNotificationMail;
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

    public function updateStatus(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,reviewing,accepted,rejected,closed',
        ]);

        $oldStatus = $feedback->status;
        $feedback->update($validated);

        if ($oldStatus !== $validated['status']) {
            $lines = ["Your ticket \"{$feedback->subject}\" ({$feedback->tracking_id}) is now: {$validated['status']}."];

            if ($validated['status'] === 'closed') {
                $lines[] = 'If you have further questions, you can reopen it from the tracking page.';
            }

            $this->notifySubmitter(
                $feedback,
                "Ticket status updated ({$feedback->tracking_id})",
                $lines
            );
        }

        return back()->with('success', 'Status updated.');
    }

    public function respond(Request $request, Feedback $feedback)
    {
        if (in_array($feedback->status, ['closed', 'rejected'])) {
            return back()->withErrors(['message' => 'This ticket is closed. Change its status to respond.']);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        FeedbackResponse::create([
            ...$validated,
            'feedback_id' => $feedback->id,
            'admin_id' => Auth::id(),
            'sender_type' => 'admin',
        ]);

        $this->notifySubmitter(
            $feedback,
            "Support replied to your ticket ({$feedback->tracking_id})",
            [
                "Support responded to your ticket \"{$feedback->subject}\":",
                $validated['message'],
            ]
        );

        return back()->with('success', 'Response sent.');
    }

    /** Feedback submitters aren't registered users, so this always sends — no preference toggle applies. */
    private function notifySubmitter(Feedback $feedback, string $subject, array $lines): void
    {
        try {
            Mail::to($feedback->email)->queue(
                new SynkroNotificationMail(
                    $feedback->name,
                    $subject,
                    $lines,
                    url(route('feedback.page', [], false)),
                    'Track Your Ticket'
                )
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }
}