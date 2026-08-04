<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Disconnecting a device (see DeviceSessionController) only deletes its row
 * from the `sessions` table today - that device stays looking "logged in"
 * client-side (websocket still connected, page still rendered) until its
 * next HTTP request happens to fail. This broadcasts to every one of the
 * user's open tabs/devices so the disconnected one can react immediately,
 * the same live-kick pattern AccountDeleted/'suspended' already use.
 *
 * Every tab receives this (deliberately NOT ->toOthers(), since the tab
 * that should react is a *different* device than the one that issued the
 * disconnect, not "every socket except the actor's"). Exactly one of
 * $sessionId / $exceptSessionId is set:
 *   - $sessionId: a single specific device was disconnected - only the tab
 *     whose own session id matches should sign out.
 *   - $exceptSessionId: "disconnect all others" - every tab EXCEPT the one
 *     whose session id matches (the actor's own) should sign out.
 */
class DeviceDisconnected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public ?string $sessionId = null,
        public ?string $exceptSessionId = null
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'settings.device-disconnected';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'except_session_id' => $this->exceptSessionId,
        ];
    }
}
