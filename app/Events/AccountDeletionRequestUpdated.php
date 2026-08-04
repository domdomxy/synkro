<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only. Covers both halves of the pre-confirmation deletion flow -
 * AccountController::requestDeletion() (step 1: sends the confirm email) and
 * cancelDeletion() - so another open tab's Account panel doesn't keep
 * showing a stale "deletion pending" (or "not pending") banner. This is
 * distinct from AccountDeleted, which only fires once the deletion is
 * actually confirmed via the emailed link.
 */
class AccountDeletionRequestUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public bool $pending,
        public ?string $deletionRequestedAt = null
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'account.deletion-request-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'pending' => $this->pending,
            'deletion_requested_at' => $this->deletionRequestedAt,
        ];
    }
}
