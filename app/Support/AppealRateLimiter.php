<?php

namespace App\Support;

use App\Models\SuspensionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Shared appeal cooldown check. Originally this logic lived only inside
 * SuspensionAppealController::store(), so a user who had already appealed
 * within the last 6 hours would only find out once they filled in the whole
 * form and submitted it. Extracting it here lets the login page pre-check the
 * same cooldown for the suspended account (whose email it already knows from
 * the session) and show the cooldown notice immediately, with no wasted typing.
 *
 * The cooldown is scoped to the user's *current* suspension (the open
 * suspension_logs row, i.e. lifted_at is null) rather than the raw email.
 * That way an appeal made against a suspension that has since been lifted —
 * whether the appeal was accepted, a timed suspension expired, or an admin
 * lifted it manually — doesn't carry over and block an appeal against a
 * brand new suspension, even if the old 6-hour window hasn't fully elapsed.
 */
class AppealRateLimiter
{
    /**
     * Returns the rate-limit key for the email's *current* suspension, or
     * null if there's nothing to key against (no such user, or the user
     * isn't currently suspended) — in which case there's no cooldown to
     * apply or check.
     */
    public static function key(string $email): ?string
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            return null;
        }

        $suspensionLog = SuspensionLog::where('user_id', $user->id)
            ->whereNull('lifted_at')
            ->latest()
            ->first();

        if (! $suspensionLog) {
            return null;
        }

        return 'appeal-submit:suspension:' . $suspensionLog->id;
    }

    /**
     * Returns the same "wait N minutes..." message the submit endpoint would
     * reject with, or null if the given email isn't currently throttled.
     */
    public static function message(?string $email, ?Request $request = null): ?string
    {
        if (! $email) {
            return null;
        }

        $key = static::key($email);

        if (! $key || ! RateLimiter::tooManyAttempts($key, 1)) {
            return null;
        }

        $seconds = RateLimiter::availableIn($key);
        $cooldownEndsAt = now()->addSeconds($seconds)->setTimezone(DeviceTimezone::resolve($request));

        return sprintf(
            'You can only submit one appeal every 6 hours. Please wait %s before trying again (available at %s).',
            static::formatDuration($seconds),
            $cooldownEndsAt->format('g:i A')
        );
    }

    /**
     * Format a number of seconds as a human-readable duration, e.g. "42 minutes"
     * or "1 hour 5 minutes".
     */
    private static function formatDuration(int $seconds): string
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
