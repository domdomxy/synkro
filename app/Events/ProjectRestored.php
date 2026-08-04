<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Per-recipient bell/toast notification that a trashed project was restored -
 * the restore-side counterpart to ProjectDeleted. Kept as its own event
 * (rather than reusing ProjectDeleted's 'project.deleted' broadcast name)
 * because the frontend renders fixed copy per broadcast type; reusing the
 * deleted event would show "was deleted" text for a restore.
 */
class ProjectRestored implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $userId,
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
        return 'project.restored';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'project_name' => $this->projectName,
            'project_id' => $this->projectId,
            'type' => 'project_restored',
        ];
    }
}
