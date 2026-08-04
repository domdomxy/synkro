<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only. Trusted hosts are stored on the account (see
 * TrustedHostController's docblock), so the frontend already has a
 * same-tab pub/sub for them (resources/js/utils/trustedHosts.js) shared
 * between the Settings panel and ExternalLinkGuard - this event lets that
 * same cache be kept in sync across *other* tabs/devices too, instead of
 * only within the tab that made the change.
 */
class TrustedHostsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public array $hosts
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'settings.trusted-hosts-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'hosts' => $this->hosts,
        ];
    }
}
