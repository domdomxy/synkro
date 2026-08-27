<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

// Fired whenever a single notification transitions from unread to read
// (bell row click, or a NotificationToast click - both go through
// NotificationController::markRead()). Lets any other open tab/device keep
// its own NotificationBell badge and row state in sync without a reload,
// same as NotificationDeleted/NotificationUpdated already do for deletes
// and pile shrinks.
class NotificationRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $recipientId,
        public int $notificationId,
        public ?string $readAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'notification.read';
    }

    public function broadcastWith(): array
    {
        return [
            // Distinguishes this from every other bell payload shape so the
            // frontend can route it without guessing from field presence,
            // matching the 'kind' convention NotificationUpdated already uses.
            'kind' => 'read',
            'notification_id' => $this->notificationId,
            'read_at' => $this->readAt,
        ];
    }
}
