<?php

namespace App\Observers;

use App\Models\Task;
use App\Support\PlatformStats;

class TaskObserver
{
    public function created(Task $task): void
    {
        PlatformStats::broadcastRefresh();
    }

    public function deleted(Task $task): void
    {
        PlatformStats::broadcastRefresh();
    }
}
