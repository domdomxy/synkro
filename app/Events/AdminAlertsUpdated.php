<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class AdminAlertsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public bool $hasPending,
        public int $pendingAppeals = 0,
        public int $pendingFeedbacks = 0,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('admin-alerts')];
    }

    public function broadcastAs(): string
    {
        return 'alerts.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'hasPending' => $this->hasPending,
            'pendingAppeals' => $this->pendingAppeals,
            'pendingFeedbacks' => $this->pendingFeedbacks,
        ];
    }
}
