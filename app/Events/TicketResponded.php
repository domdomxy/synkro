<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class TicketResponded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public string $trackingId,
        public string $subject,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'ticket.responded';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'tracking_id' => $this->trackingId,
            'subject' => $this->subject,
            'type' => 'ticket_responded',
        ];
    }
}
