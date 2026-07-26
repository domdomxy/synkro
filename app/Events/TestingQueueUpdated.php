<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Tells one user their testing-queue count (tasks awaiting/under review across
 * every project where they're an owner, manager, or tester) just changed, so
 * the "Testing" nav badge can update live instead of waiting for a page reload.
 */
class TestingQueueUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $recipientId, public int $pendingCount) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'testing.queue-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'pendingCount' => $this->pendingCount,
        ];
    }
}
