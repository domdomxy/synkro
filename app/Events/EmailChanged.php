<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class EmailChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public string $newEmail,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'email.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'new_email' => $this->newEmail,
            'type' => 'email_changed',
        ];
    }
}
