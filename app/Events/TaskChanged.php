<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired whenever a task's shared, everyone-sees-it state changes - created,
 * edited, deleted, moved through the status lifecycle, reassigned, or bulk-
 * updated - so every member currently viewing the project (the kanban board,
 * a task list, or the task focus modal) picks up the change live instead of
 * needing a manual refresh. Deliberately separate from TaskAssigned/TaskUpdated/
 * etc., which are personal notification pushes to a single recipient's
 * `user.{id}` channel; this one is a project-wide "something changed, go
 * re-fetch" signal on `project.{id}`, mirroring how comment.posted/updated/
 * deleted already keep the project prop in sync.
 */
class TaskChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $projectId, public int $taskId) {}

    public static function for(Task $task): self
    {
        return new self($task->project_id, $task->id);
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'task.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->taskId,
            'project_id' => $this->projectId,
        ];
    }
}
