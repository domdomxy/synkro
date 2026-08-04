<?php

namespace App\Support;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The "Logged in devices" section of Settings (see DeviceSessionsSection.jsx)
 * shows currently-active sessions, not a historical log - this replaced the
 * old self-service Login History page (see git history / Pages/LoginHistory.jsx,
 * still used admin-side for user support at Admin/UserLoginHistory.jsx).
 *
 * Backed directly by Laravel's own `sessions` table (SESSION_DRIVER=database),
 * so there's no separate table to keep in sync - deleting a row here is what
 * actually disconnects a device (see DeviceSessionController::disconnect()).
 */
class DeviceSessionData
{
    public static function forUser(User $user, ?string $currentSessionId = null): array
    {
        // Session rows past the configured lifetime are already dead (Laravel
        // just hasn't garbage-collected them yet - GC is probabilistic, see
        // config('session.lottery')), so they're filtered out here rather than
        // shown as a phantom "active" device that can no longer actually be used.
        $cutoff = now()->subMinutes((int) config('session.lifetime'))->timestamp;

        $devices = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('last_activity', '>=', $cutoff)
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($session) use ($currentSessionId) {
                $agent = UserAgentParser::parse($session->user_agent);

                return [
                    'id' => $session->id,
                    'browser' => $agent['browser'],
                    'device' => $agent['device'],
                    'os' => $agent['os'],
                    'model' => $agent['model'],
                    'ip' => $session->ip_address,
                    'location' => GeoLocator::locate($session->ip_address),
                    'last_active_at' => Carbon::createFromTimestamp($session->last_activity)->toJSON(),
                    'is_current' => $currentSessionId !== null && $session->id === $currentSessionId,
                ];
            })
            // The device making this very request should always sit first,
            // regardless of last_activity ordering (it's mid-request, so its
            // own last_activity write may not have landed yet).
            ->sortByDesc('is_current')
            ->values();

        return ['devices' => $devices];
    }
}
