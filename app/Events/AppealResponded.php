<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class AppealResponded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public int $appealId,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'appeal.responded';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'appeal_id' => $this->appealId,
            'type' => 'appeal_responded',
        ];
    }
}
