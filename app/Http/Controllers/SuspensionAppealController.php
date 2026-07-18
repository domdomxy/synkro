<?php

namespace App\Http\Controllers;

use App\Models\SuspensionAppeal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class SuspensionAppealController extends Controller
{
    public function store(Request $request)
    {
        // IP-based limit (3 submissions per 60 minutes), handled here instead of via
        // route middleware so a limited request comes back as a normal Inertia error
        // shown inline on the appeal card, rather than a bare 429 error page.
        $throttleKey = 'appeal-submit:' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $cooldownEndsAt = now()->addSeconds($seconds);

            return back()
                ->withErrors([
                    'limit' => sprintf(
                        "You've reached the limit of 3 appeal submissions per hour. Please wait %s before trying again (available at %s).",
                        $this->formatDuration($seconds),
                        $cooldownEndsAt->format('g:i A')
                    ),
                ])
                ->with('suspension', $this->suspensionPayload($request->input('email')));
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'message' => 'required|string|max:2000',
        ]);

        RateLimiter::hit($throttleKey, 3600);

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

            return back()
                ->withErrors([
                    'email' => "You can only submit one appeal every 6 hours. You can submit another appeal at {$nextAllowedAt->format('M j, Y g:i A')}.",
                ])
                ->with('suspension', $this->suspensionPayload($user));
        }

        SuspensionAppeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        return back()
            ->with('success', 'Your appeal has been submitted. We will review it as soon as possible.')
            ->with('suspension', $this->suspensionPayload($user));
    }

    /**
     * Build the same suspension payload shape the login page expects, so it can be
     * re-flashed to session after an appeal submission. Accepts either a User or an
     * email string (the rate-limit path runs before validation, so the user may not
     * be resolved yet).
     */
    private function suspensionPayload(User|string|null $user): ?array
    {
        if (is_string($user)) {
            $user = User::where('email', $user)->first();
        }

        if (! $user || ! $user->is_suspended) {
            return null;
        }

        return [
            'reason' => $user->suspension_reason,
            'until' => $user->suspended_until?->toIso8601String(),
            'permanent' => $user->suspended_until === null,
            'user_id' => $user->id,
        ];
    }

    /**
     * Format a number of seconds as a human-readable duration, e.g. "42 minutes"
     * or "1 hour 5 minutes".
     */
    private function formatDuration(int $seconds): string
    {
        $minutes = (int) ceil($seconds / 60);
        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours === 0) {
            return "{$minutes} minute" . ($minutes === 1 ? '' : 's');
        }

        $hoursPart = "{$hours} hour" . ($hours === 1 ? '' : 's');

        if ($remainingMinutes === 0) {
            return $hoursPart;
        }

        return $hoursPart . " {$remainingMinutes} minute" . ($remainingMinutes === 1 ? '' : 's');
    }
}