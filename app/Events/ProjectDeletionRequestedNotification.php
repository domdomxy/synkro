<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Per-recipient bell/toast notification that a project's owner has requested
 * its deletion - distinct from ProjectDeletionRequested, which broadcasts once
 * on the shared project channel purely to update the live pending-deletion
 * banner for anyone with the project page open. This one lands in each other
 * member's own notification feed (user.{id} channel), same pattern as
 * ProjectDeleted/ProjectUpdated below.
 */
class ProjectDeletionRequestedNotification implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $recipientId,
        public int $projectId,
        public string $projectName,
        public string $requestedByName,
        public int $notificationId,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'project.deletion-requested';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'requested_by_name' => $this->requestedByName,
            'type' => 'project_deletion_requested',
        ];
    }
}
