<?php
namespace App\Console\Commands;

use App\Models\SuspensionAppeal;
use App\Models\SuspensionLog;
use App\Models\User;
use Illuminate\Console\Command;

class LiftExpiredSuspensions extends Command
{
    protected $signature = 'suspensions:lift-expired';
    protected $description = 'Automatically lifts timed suspensions that have expired.';

    public function handle(): void
    {
        $expiredUsers = User::where('is_suspended', true)
            ->whereNotNull('suspended_until')
            ->where('suspended_until', '<=', now())
            ->get();

        foreach ($expiredUsers as $user) {
            $user->update([
                'is_suspended' => false,
                'suspended_until' => null,
                'suspension_reason' => null,
                'suspended_by' => null,
            ]);

            SuspensionLog::where('user_id', $user->id)
                ->whereNull('lifted_at')
                ->latest()
                ->first()
                ?->update([
                    'lifted_at' => now(),
                    'lifted_by' => null, // null = system/automatic, distinguishes from an admin manually lifting it
                ]);

            // A pending appeal shouldn't sit there forever waiting on an admin once
            // the suspension it's appealing has already run out on its own — resolve
            // it automatically so the appeals queue stays accurate.
            SuspensionAppeal::where('user_id', $user->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'reviewed',
                    'outcome' => 'approved',
                    'admin_reason' => 'Suspension was lifted automatically after the suspension duration ended.',
                    'auto_resolved' => true,
                ]);
        }

        if ($expiredUsers->count() > 0) {
            $this->info("Lifted {$expiredUsers->count()} expired suspension(s).");
        }
    }
}