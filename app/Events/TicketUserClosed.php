<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only, same reasoning as TicketUserReplied - fired from
 * FeedbackController::close() when the ticket owner closes it themselves.
 */
class TicketUserClosed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public string $trackingId,
        public string $subject
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'ticket.user-closed';
    }

    public function broadcastWith(): array
    {
        return [
            'tracking_id' => $this->trackingId,
            'subject' => $this->subject,
        ];
    }
}
