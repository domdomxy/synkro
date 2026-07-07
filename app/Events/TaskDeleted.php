<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $taskTitle,
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
        return 'task.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'task_title' => $this->taskTitle,
            'project_name' => $this->projectName,
            'project_id' => $this->projectId,
            'message' => "\"{$this->taskTitle}\" was deleted from {$this->projectName}.",
        ];
    }
}