<?php

namespace App\Events;

use App\Models\TaskChecklistItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Personal "someone added a checklist item to your task" push, mirroring
 * TaskCommented/TaskAssigned - delivered to the assignee's own user.{id}
 * channel (not the shared project.{id} one TaskChanged uses), since only the
 * assignee cares about this as a notification even though everyone who can
 * view the checklist sees the item itself live via TaskChanged already.
 */
class TaskChecklistItemAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public TaskChecklistItem $item, public int $recipientId, public int $notificationId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'task.checklist-item-added';
    }

    public function broadcastWith(): array
    {
        $task = $this->item->task;

        return [
            'notification_id' => $this->notificationId,
            'title' => $task->title,
            'item_title' => $this->item->title,
            'added_by_name' => $this->item->creator?->name,
            'project_id' => $task->project_id,
            'task_id' => $task->id,
            'type' => 'task_checklist_item_added',
        ];
    }
}
