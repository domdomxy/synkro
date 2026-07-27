<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class TaskMentioned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public Comment $comment, public int $recipientId, public int $notificationId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'task.mentioned';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'title' => $this->comment->task->title,
            'project_id' => $this->comment->task->project_id,
            'task_id' => $this->comment->task->id,
            'comment_id' => $this->comment->id,
            'commenter_name' => $this->comment->user->name,
            'type' => 'task_mentioned',
        ];
    }
}
