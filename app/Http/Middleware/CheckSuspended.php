<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckSuspended
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();

            if ($user->is_suspended) {
                // Auto-expire a timed suspension right here, same logic as login
                if ($user->suspended_until && $user->suspended_until->isPast()) {
                    $user->update([
                        'is_suspended' => false,
                        'suspended_until' => null,
                        'suspension_reason' => null,
                        'suspended_by' => null,
                    ]);

                    \App\Models\SuspensionLog::where('user_id', $user->id)->whereNull('lifted_at')->latest()->first()?->update([
                        'lifted_at' => now(),
                        'lifted_by' => null,
                    ]);

                    // Same as the suspensions:lift-expired scheduled job — a pending
                    // appeal shouldn't sit there forever once the suspension it's
                    // appealing has already run out on its own.
                    \App\Models\SuspensionAppeal::where('user_id', $user->id)
                        ->where('status', 'pending')
                        ->update([
                            'status' => 'reviewed',
                            'outcome' => 'approved',
                            'admin_reason' => 'Suspension was lifted automatically after the suspension duration ended.',
                            'auto_resolved' => true,
                        ]);
                } else {
                    $suspensionData = [
                        'reason' => $user->suspension_reason,
                        'until' => $user->suspended_until?->toIso8601String(),
                        'permanent' => $user->suspended_until === null,
                        'user_id' => $user->id,
                    ];

                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()->route('login')->with('suspension', $suspensionData);
                }
            }
        }

        return $next($request);
    }
}