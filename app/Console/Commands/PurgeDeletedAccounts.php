<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PurgeDeletedAccounts extends Command
{
    protected $signature = 'accounts:purge-deleted';
    protected $description = 'Permanently deletes accounts whose post-deletion grace period has ended.';

    public function handle(): void
    {
        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);

        $expired = User::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays($graceDays))
            ->get();

        foreach ($expired as $user) {
            // forceDelete() removes the row for real; this is what cascades/nulls
            // out everything still hanging off it at the DB level (owned projects,
            // task assignments, notifications, activity logs, etc.) — the same
            // relationships confirmDeletion() already unwound at the app level
            // when the deletion was first confirmed.
            $user->forceDelete();
        }

        if ($expired->count() > 0) {
            $this->info("Permanently deleted {$expired->count()} account(s) past their {$graceDays}-day grace period.");
        }
    }
}
