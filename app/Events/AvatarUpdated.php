<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only. The navbar/account menu avatar comes from the shared
 * `auth.user` Inertia prop on every page, so any other open tab just needs
 * a nudge to refetch that prop - see AvatarSyncListener.jsx, which reacts
 * to this by doing `router.reload({ only: ['auth'] })` rather than trying
 * to carry the new image itself over the socket.
 */
class AvatarUpdated implements ShouldBroadcastNow
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
        return 'account.avatar-updated';
    }

    public function broadcastWith(): array
    {
        return [];
    }
}
