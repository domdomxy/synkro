<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only - deliberately distinct from TicketResponded (which fires
 * when *support* replies and carries a real UserNotification id for the
 * bell). This fires when the ticket owner themselves replies from the
 * Support panel, purely so another tab/device they're signed into can show
 * the new message live instead of only on next visit. Only broadcast when
 * the ticket's email matches a registered user - see
 * FeedbackController::findRegisteredUser().
 */
class TicketUserReplied implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public string $trackingId,
        public string $subject,
        public string $message
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'ticket.user-replied';
    }

    public function broadcastWith(): array
    {
        return [
            'tracking_id' => $this->trackingId,
            'subject' => $this->subject,
            'message' => $this->message,
        ];
    }
}
