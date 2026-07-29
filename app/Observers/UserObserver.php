<?php

namespace App\Observers;

use App\Models\User;
use App\Support\PlatformStats;

class UserObserver
{
    public function created(User $user): void
    {
        PlatformStats::broadcastRefresh();
    }

    public function deleted(User $user): void
    {
        PlatformStats::broadcastRefresh();
    }
}
