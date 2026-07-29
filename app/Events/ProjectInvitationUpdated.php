<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

// A lightweight "something about this project's invitations changed" ping -
// like CommentPosted/CommentDeleted, it doesn't carry the invitation payload
// itself, it just tells anyone viewing the project to re-fetch pendingInvitations
// (and project, since an acceptance also adds a new member) rather than trying
// to patch local state in place.
class ProjectInvitationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $projectId,
        public string $status
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'invitation.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'status' => $this->status,
        ];
    }
}
