<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

// A lightweight "this project's roster changed" ping - like CommentPosted/
// CommentDeleted, it doesn't carry the changed record itself, it just tells
// anyone viewing the project to re-fetch `project` (members, roles) and
// `pendingInvitations` rather than trying to patch local state in place.
// Covers every event that can change who's on the project or who's been
// invited: an invitation being sent, cancelled, accepted, or denied; a
// member's role changing; a member being removed; or a member leaving.
class ProjectRosterUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $projectId,
        public string $reason
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.'.$this->projectId)];
    }

    public function broadcastAs(): string
    {
        return 'roster.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'reason' => $this->reason,
        ];
    }
}
