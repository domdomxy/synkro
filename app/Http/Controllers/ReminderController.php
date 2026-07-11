<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReminderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'note' => 'nullable|string',
            'remind_at' => 'required|date|after:now',
            'repeat_interval' => 'nullable|in:none,daily,weekly,monthly',
        ]);

        Reminder::create([...$validated, 'user_id' => Auth::id()]);

        return back()->with('success', 'Reminder set.');
    }

    public function dismiss(Reminder $reminder)
    {
        abort_unless($reminder->user_id === Auth::id(), 403);
        $reminder->update(['dismissed' => true]);
        return back();
    }

    public function destroy(Reminder $reminder)
    {
        abort_unless($reminder->user_id === Auth::id(), 403);
        $reminder->delete();
        return back();
    }
}