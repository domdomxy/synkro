<?php

namespace App\Support;

use App\Events\AdminAlertsUpdated;
use App\Models\Feedback;
use App\Models\SuspensionAppeal;
use App\Models\Task;

class AdminAlerts
{
    /**
     * Same counts used to share the initial adminAlerts Inertia prop and the
     * dashboard's "Needs Attention" panel — kept in one place so the broadcast
     * and the page-load values can never drift apart. pendingResolution
     * (tasks with pending submission decisions) is included alongside the
     * appeal/feedback counts so the whole panel stays live, not just two
     * thirds of it.
     */
    public static function counts(): array
    {
        return [
            'pendingAppeals' => SuspensionAppeal::where('status', 'pending')->count(),
            'pendingFeedbacks' => Feedback::whereIn('status', ['pending', 'reviewing'])->count(),
            'pendingResolution' => Task::where('pending_resolution', true)->count(),
        ];
    }

    public static function hasPending(): bool
    {
        $counts = self::counts();

        return $counts['pendingAppeals'] > 0 || $counts['pendingFeedbacks'] > 0 || $counts['pendingResolution'] > 0;
    }

    public static function broadcastRefresh(): void
    {
        try {
            $counts = self::counts();

            broadcast(new AdminAlertsUpdated(
                hasPending: $counts['pendingAppeals'] > 0 || $counts['pendingFeedbacks'] > 0 || $counts['pendingResolution'] > 0,
                pendingAppeals: $counts['pendingAppeals'],
                pendingFeedbacks: $counts['pendingFeedbacks'],
                pendingResolution: $counts['pendingResolution'],
            ));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
