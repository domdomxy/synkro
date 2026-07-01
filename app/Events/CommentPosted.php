<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CommentPosted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public Comment $comment) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->comment->task->project_id)];
    }

    public function broadcastAs(): string
    {
        return 'comment.posted';
    }
}