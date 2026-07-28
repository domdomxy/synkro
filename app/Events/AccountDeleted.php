<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccountDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    // Plain id rather than a User model: by the time this broadcasts, the
    // user row is already gone, so there's nothing left to re-fetch.
    public function __construct(public int $userId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'account.deleted';
    }
}
