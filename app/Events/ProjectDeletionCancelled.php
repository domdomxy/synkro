<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectDeletionCancelled implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $projectId,
        public string $projectName,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'project.deletion_cancelled';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
            'project_name' => $this->projectName,
            'type' => 'project_deletion_cancelled',
        ];
    }
}
