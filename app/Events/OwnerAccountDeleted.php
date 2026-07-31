<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class OwnerAccountDeleted implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(
        public int $recipientId,
        public string $ownerName,
        public Project $project,
        public string $restoreByIso,
        public int $notificationId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('user.'.$this->recipientId)];
    }

    public function broadcastAs(): string
    {
        return 'owner.account-deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notificationId,
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'owner_name' => $this->ownerName,
            'restore_by' => $this->restoreByIso,
            'type' => 'owner_account_deleted',
        ];
    }
}
