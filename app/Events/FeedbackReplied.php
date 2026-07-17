<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class FeedbackReplied implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $adminId,
        public string $trackingId,
        public string $subject,
        public string $submitterName,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->adminId)];
    }

    public function broadcastAs(): string
    {
        return 'feedback.replied';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'tracking_id' => $this->trackingId,
            'subject' => $this->subject,
            'submitter_name' => $this->submitterName,
            'type' => 'feedback_replied',
        ];
    }
}
