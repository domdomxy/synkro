<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectDeletionRequested implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $projectId,
        public string $projectName,
        public string $requestedByName,
    ) {}

    /**
     * Broadcast to every member currently on the project (not just the requester), so
     * anyone looking at the project sees the pending-deletion state show up live.
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'project.deletion_requested';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'requested_by_name' => $this->requestedByName,
            'type' => 'project_deletion_requested',
        ];
    }
}
