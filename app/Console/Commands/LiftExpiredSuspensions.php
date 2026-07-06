<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class LiftExpiredSuspensions extends Command
{
    protected $signature = 'suspensions:lift-expired';
    protected $description = 'Automatically lifts timed suspensions that have expired.';

    public function handle(): void
    {
        $count = User::where('is_suspended', true)
            ->whereNotNull('suspended_until')
            ->where('suspended_until', '<=', now())
            ->update([
                'is_suspended' => false,
                'suspended_until' => null,
                'suspension_reason' => null,
                'suspended_by' => null,
            ]);

        if ($count > 0) {
            $this->info("Lifted {$count} expired suspension(s).");
        }
    }
}