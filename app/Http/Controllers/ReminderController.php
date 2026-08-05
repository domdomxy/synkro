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

    public function update(Request $request, Reminder $reminder)
    {
        abort_unless($reminder->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'note' => 'nullable|string',
            'remind_at' => 'required|date|after:now',
            'repeat_interval' => 'nullable|in:none,daily,weekly,monthly',
        ]);

        // Reset notified_at so an edited reminder still fires at its (possibly new) time.
        $reminder->update([...$validated, 'notified_at' => null]);

        return back()->with('success', 'Reminder updated.');
    }

    public function dismiss(Reminder $reminder)
    {
        abort_unless($reminder->user_id === Auth::id(), 403);

        if ($reminder->repeat_interval === 'none') {
            // A one-off reminder has no future occurrence to skip to, so
            // dismissing it is the same as before: hide it from the dashboard
            // for good. The frontend no longer offers this button for
            // one-off reminders, but the guard stays here in case the route
            // is ever hit directly.
            $reminder->update(['dismissed' => true]);
            return back();
        }

        // Repeating reminder: skip only the upcoming occurrence. Advance
        // remind_at by one cadence (same math as SendDueReminders uses when
        // a reminder actually fires) and reset notified_at, WITHOUT setting
        // dismissed - so the reminder stays visible on the dashboard and
        // keeps repeating, it just never notifies for this turn.
        $nextDate = match ($reminder->repeat_interval) {
            'daily' => $reminder->remind_at->copy()->addDay(),
            'weekly' => $reminder->remind_at->copy()->addWeek(),
            'monthly' => $reminder->remind_at->copy()->addMonth(),
        };

        $reminder->update(['remind_at' => $nextDate, 'notified_at' => null]);

        return back()->with('success', 'Skipped to the next occurrence.');
    }

    public function destroy(Reminder $reminder)
    {
        abort_unless($reminder->user_id === Auth::id(), 403);
        $reminder->delete();
        return back();
    }
}