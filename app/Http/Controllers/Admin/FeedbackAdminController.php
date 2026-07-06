<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeedbackAdminController extends Controller
{
    public function index(Request $request)
    {
        $feedbacks = Feedback::with('responses.admin')
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

        $feedback->update($validated);

        return back()->with('success', 'Status updated.');
    }

    public function respond(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        FeedbackResponse::create([
            ...$validated,
            'feedback_id' => $feedback->id,
            'admin_id' => Auth::id(),
            'sender_type' => 'admin',
        ]);

        return back()->with('success', 'Response sent.');
    }
}