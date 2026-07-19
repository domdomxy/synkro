<?php

namespace App\Support;

use Illuminate\Http\Request;

class DeviceTimezone
{
    /**
     * Resolve the IANA timezone identifier the current request's browser reported
     * (via the `device_timezone` cookie set on app boot), falling back to the
     * app's configured timezone if missing or invalid. This is only ever used to
     * format timestamps shown back to that same device (e.g. cooldown messages) —
     * it never touches app.timezone globally, so stored timestamps stay in UTC.
     */
    public static function resolve(?Request $request = null): string
    {
        $request = $request ?? request();
        $candidate = $request?->cookie('device_timezone');

        if ($candidate && in_array($candidate, timezone_identifiers_list(), true)) {
            return $candidate;
        }

        return config('app.timezone');
    }
}
