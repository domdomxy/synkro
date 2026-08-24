<?php

namespace App\Support;

class DurationFormatter
{
    /**
     * Minutes -> "1 day", "3 hours", "15 minutes", etc. Used to render
     * reminder_offset_minutes in activity logs, change notifications, and
     * emails without exposing the raw minute count. Null stays the caller's
     * responsibility (usually "No reminder").
     */
    public static function humanize(?int $minutes): string
    {
        if ($minutes === null) {
            return 'No reminder';
        }

        if ($minutes % (7 * 24 * 60) === 0 && $minutes >= 7 * 24 * 60) {
            $weeks = intdiv($minutes, 7 * 24 * 60);
            return $weeks === 1 ? '1 week before' : "{$weeks} weeks before";
        }

        if ($minutes % (24 * 60) === 0 && $minutes >= 24 * 60) {
            $days = intdiv($minutes, 24 * 60);
            return $days === 1 ? '1 day before' : "{$days} days before";
        }

        if ($minutes % 60 === 0 && $minutes >= 60) {
            $hours = intdiv($minutes, 60);
            return $hours === 1 ? '1 hour before' : "{$hours} hours before";
        }

        return $minutes === 1 ? '1 minute before' : "{$minutes} minutes before";
    }
}
