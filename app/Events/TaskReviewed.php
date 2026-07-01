<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class TaskReviewed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

        public function __construct(
        public Task $task,
        public string $decision,
        public ?string $feedback,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->task->assigned_to)];
    }

    public function broadcastAs(): string
    {
        return 'task.reviewed';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'title' => $this->task->title,
            'decision' => $this->decision,
            'feedback' => $this->feedback,
            'task_id' => $this->task->id,
            'type' => $this->decision === 'approve' ? 'task_approved' : 'task_rejected',
        ];
    }
}