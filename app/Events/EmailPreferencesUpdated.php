<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only (no UserNotification row, no bell entry) - this isn't
 * something worth interrupting the person for, it just keeps any other open
 * tab/device's Settings panel showing the preferences that were just saved
 * here instead of a stale copy. See SettingsController::updateEmailPreferences().
 */
class EmailPreferencesUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $userId,
        public array $preferences
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'settings.email-preferences-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'preferences' => $this->preferences,
        ];
    }
}
