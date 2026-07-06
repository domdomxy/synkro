<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
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
            'attachment' => 'nullable|image|max:4096',
        ]);

        $path = $request->hasFile('attachment')
            ? $request->file('attachment')->store('feedback-attachments', 'public')
            : null;

        $feedback = Feedback::create([...$validated, 'attachment_path' => $path]);

        return redirect()->route('feedback.page')
            ->with('feedback_tracking_id', $feedback->tracking_id);
    }

    public function track(Request $request)
    {
        $validated = $request->validate([
            'tracking_id' => 'required|string',
        ]);

        $feedback = Feedback::with('responses.admin')
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

        return response()->json(['success' => true, 'response' => $response]);
    }
}