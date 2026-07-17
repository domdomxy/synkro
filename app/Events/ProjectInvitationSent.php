<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ProjectInvitationSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $recipientId,
        public Project $project,
        public string $role,
        public string $inviterName,
        public string $token,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'project.invitation';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'role' => $this->role,
            'inviter_name' => $this->inviterName,
            'token' => $this->token,
            'type' => 'project_invitation',
        ];
    }
}
