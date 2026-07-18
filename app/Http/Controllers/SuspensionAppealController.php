<?php

namespace App\Http\Controllers;

use App\Models\SuspensionAppeal;
use App\Models\User;
use Illuminate\Http\Request;

class SuspensionAppealController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'message' => 'required|string|max:2000',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user->is_suspended) {
            return back()->withErrors(['email' => 'This account is not currently suspended.']);
        }

        // Limits repeated appeal spam while still letting someone follow up same-day if their
        // situation changes; 6 hours is generous enough for a genuine second attempt without
        // being so long it feels punitive.
        $lastAppeal = SuspensionAppeal::where('user_id', $user->id)->latest()->first();
        if ($lastAppeal && $lastAppeal->created_at->gt(now()->subHours(6))) {
            $nextAllowedAt = $lastAppeal->created_at->addHours(6);
            return back()->withErrors([
                'email' => "You can only submit one appeal every 6 hours. You can submit another appeal at {$nextAllowedAt->format('M j, Y g:i A')}.",
            ]);
        }

        SuspensionAppeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        return back()->with('success', 'Your appeal has been submitted. We will review it as soon as possible.');
    }
}