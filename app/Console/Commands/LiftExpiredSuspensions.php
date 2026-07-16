<?php
namespace App\Console\Commands;

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
        }

        if ($expiredUsers->count() > 0) {
            $this->info("Lifted {$expiredUsers->count()} expired suspension(s).");
        }
    }
}