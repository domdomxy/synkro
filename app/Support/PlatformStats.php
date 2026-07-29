<?php

namespace App\Support;

use App\Events\PlatformStatsUpdated;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class PlatformStats
{
    /**
     * Same counts used for the Welcome page's initial Inertia prop and the
     * live broadcast - kept in one place so the two can never drift apart.
     */
    public static function counts(): array
    {
        return [
            'users' => User::count(),
            'projects' => Project::count(),
            'tasks' => Task::count(),
        ];
    }

    public static function broadcastRefresh(): void
    {
        try {
            broadcast(new PlatformStatsUpdated(self::counts()));
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
