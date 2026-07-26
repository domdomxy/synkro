<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $projectName,
        public int $projectId,
        public ?int $notificationId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->userId)];
    }

    public function broadcastAs(): string
    {
        return 'project.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'project_name' => $this->projectName,
            'project_id' => $this->projectId,
            'type' => 'project_deleted',
        ];
    }
}
