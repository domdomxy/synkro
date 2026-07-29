<?php

namespace App\Observers;

use App\Models\Project;
use App\Support\PlatformStats;

class ProjectObserver
{
    public function created(Project $project): void
    {
        PlatformStats::broadcastRefresh();
    }

    public function deleted(Project $project): void
    {
        PlatformStats::broadcastRefresh();
    }
}
