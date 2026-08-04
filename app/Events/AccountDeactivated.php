<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * AccountController::deactivate() only logs out the session making the
 * request; any other device the person is signed into stays fully logged
 * in (nothing checks `is_active` for an already-authenticated session).
 * This broadcasts to every open tab/device so they all sign out live too,
 * the same pattern as AccountDeleted/'suspended' - see
 * AccountDeactivatedListener.jsx.
 */
class AccountDeactivated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'account.deactivated';
    }

    public function broadcastWith(): array
    {
        return [];
    }
}
