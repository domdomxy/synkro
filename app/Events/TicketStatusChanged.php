<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class TicketStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public string $trackingId,
        public string $subject,
        public string $status,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'ticket.status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'tracking_id' => $this->trackingId,
            'subject' => $this->subject,
            'status' => $this->status,
            'type' => 'ticket_status_changed',
        ];
    }
}
