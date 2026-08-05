<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\AccountDeletion;
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
            // Only pending_resolution tasks remain to release here — everything else was
            // already reset back when the account was first soft-deleted (see
            // AccountDeletion::unwindProjectsAndDelete()).
            AccountDeletion::purgeNow($user, onlyPendingTasks: true);
        }

        if ($expired->count() > 0) {
            $this->info("Permanently deleted {$expired->count()} account(s) past their {$graceDays}-day grace period.");
        }
    }
}
