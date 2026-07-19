<?php

namespace App\Support;

use App\Events\AdminAlertsUpdated;
use App\Models\Feedback;
use App\Models\SuspensionAppeal;

class AdminAlerts
{
    /**
     * Same counts used to share the initial adminAlerts Inertia prop and the
     * dashboard's "Needs Attention" panel — kept in one place so the broadcast
     * and the page-load values can never drift apart.
     */
    public static function counts(): array
    {
        return [
            'pendingAppeals' => SuspensionAppeal::where('status', 'pending')->count(),
            'pendingFeedbacks' => Feedback::whereIn('status', ['pending', 'reviewing'])->count(),
        ];
    }

    public static function hasPending(): bool
    {
        $counts = self::counts();

        return $counts['pendingAppeals'] > 0 || $counts['pendingFeedbacks'] > 0;
    }

    public static function broadcastRefresh(): void
    {
        try {
            $counts = self::counts();

            broadcast(new AdminAlertsUpdated(
                hasPending: $counts['pendingAppeals'] > 0 || $counts['pendingFeedbacks'] > 0,
                pendingAppeals: $counts['pendingAppeals'],
                pendingFeedbacks: $counts['pendingFeedbacks'],
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
