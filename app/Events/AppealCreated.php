<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class AppealCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $adminId,
        public int $appealId,
        public string $userName,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->adminId)];
    }

    public function broadcastAs(): string
    {
        return 'appeal.created';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'appeal_id' => $this->appealId,
            'user_name' => $this->userName,
            'type' => 'appeal_created',
        ];
    }
}
