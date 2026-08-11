<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NotificationDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $recipientId,
        public int $notificationId,
        public bool $wasUnread,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'notification.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'was_unread' => $this->wasUnread,
        ];
    }
}
