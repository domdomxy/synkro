<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NotificationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $recipientId,
        public int $notificationId,
        public string $message,
        public ?string $url,
        public int $pileCount,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'notification.updated';
    }

    public function broadcastWith(): array
    {
        return [
            // Distinguishes this from every other bell payload shape so the
            // frontend can route it without guessing from field presence.
            'kind' => 'pile_updated',
            'notification_id' => $this->notificationId,
            'message' => $this->message,
            'url' => $this->url,
            'pile_count' => $this->pileCount,
        ];
    }
}
