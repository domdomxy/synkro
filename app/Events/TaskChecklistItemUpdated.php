<?php

namespace App\Events;

use App\Models\TaskChecklistItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Personal "a checklist item on your task was renamed" push, mirroring
 * TaskChecklistItemAdded - delivered to the assignee's own user.{id} channel
 * only, since (like the "added" case) everyone viewing the checklist already
 * sees the rename live via TaskChanged; this is just the notification.
 */
class TaskChecklistItemUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public TaskChecklistItem $item,
        public string $oldTitle,
        public int $recipientId,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'task.checklist-item-updated';
    }

    public function broadcastWith(): array
    {
        $task = $this->item->task;

        return [
            'notification_id' => $this->notificationId,
            'title' => $task->title,
            'old_item_title' => $this->oldTitle,
            'new_item_title' => $this->item->title,
            'editor_name' => \Illuminate\Support\Facades\Auth::user()->name,
            'project_id' => $task->project_id,
            'task_id' => $task->id,
            'type' => 'task_checklist_item_updated',
        ];
    }
}
