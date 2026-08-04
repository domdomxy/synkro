<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Self-sync only, same reasoning as EmailPreferencesUpdated - see
 * SettingsController::updateNotificationPreferences().
 */
class NotificationPreferencesUpdated implements ShouldBroadcastNow
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
        return 'settings.notification-preferences-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'preferences' => $this->preferences,
        ];
    }
}
