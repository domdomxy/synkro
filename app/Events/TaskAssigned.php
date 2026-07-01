<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class TaskAssigned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public Task $task, public int $notificationId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->task->assigned_to)];
    }

    public function broadcastAs(): string
    {
        return 'task.assigned';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'task_id' => $this->task->id,
            'type' => 'task_assigned',
        ];
    }
}