<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class PlatformStatsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public array $counts,
    ) {}

    /**
     * Plain (public) channel, not PrivateChannel: the Welcome page's stat strip
     * is visible to guests who aren't logged in at all, and a PrivateChannel
     * would require an authorize callback in routes/channels.php that runs
     * against an authenticated user - there isn't one to check here.
     */
    public function broadcastOn(): array
    {
        return [new Channel('platform-stats')];
    }

    public function broadcastAs(): string
    {
        return 'stats.updated';
    }

    public function broadcastWith(): array
    {
        return $this->counts;
    }
}
