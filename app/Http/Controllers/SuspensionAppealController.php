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

        SuspensionAppeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        return back()->with('success', 'Your appeal has been submitted. We will review it as soon as possible.');
    }
}