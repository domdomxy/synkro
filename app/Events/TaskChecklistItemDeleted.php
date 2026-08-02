<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Personal "a checklist item on your task was removed" push, mirroring
 * TaskChecklistItemAdded. Takes the task and item title as plain values
 * rather than the TaskChecklistItem model, since by the time this fires the
 * item itself has already been deleted.
 */
class TaskChecklistItemDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Task $task,
        public string $itemTitle,
        public int $recipientId,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'task.checklist-item-deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'title' => $this->task->title,
            'item_title' => $this->itemTitle,
            'deleted_by_name' => \Illuminate\Support\Facades\Auth::user()->name,
            'project_id' => $this->task->project_id,
            'task_id' => $this->task->id,
            'type' => 'task_checklist_item_deleted',
        ];
    }
}
