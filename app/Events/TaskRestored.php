<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Per-recipient bell/toast notification that a trashed task was restored -
 * the restore-side counterpart to TaskDeleted. Kept as its own event (rather
 * than reusing TaskDeleted's 'task.deleted' broadcast name) because
 * TaskDeleted::broadcastWith() hardcodes "was deleted from" into its own
 * message text; reusing it here would show the wrong wording for a restore.
 */
class TaskRestored implements ShouldBroadcastNow
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
        return 'task.restored';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'task_title' => $this->taskTitle,
            'project_name' => $this->projectName,
            'project_id' => $this->projectId,
            'message' => "\"**{$this->taskTitle}**\" was restored from the trash in **{$this->projectName}**.",
            'type' => 'task_restored',
        ];
    }
}
