<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'suspension' => session('suspension'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        if ($user->is_suspended) {
            // Auto-expire a timed suspension right here instead of waiting for the scheduler
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
            } else {
                $suspensionData = [
                    'reason' => $user->suspension_reason,
                    'until' => $user->suspended_until?->toIso8601String(),
                    'permanent' => $user->suspended_until === null,
                    'user_id' => $user->id,
                    'email' => $user->email,
                ];

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->with('suspension', $suspensionData);
            }
        }
        if ($user->must_change_password && $user->temp_password_expires_at && $user->temp_password_expires_at->isPast()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('passwordExpired', true);
        }
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function suspendedLogout(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $suspensionData = $user ? [
            'reason' => $user->suspension_reason,
            'until' => $user->suspended_until?->toIso8601String(),
            'permanent' => $user->suspended_until === null,
            'user_id' => $user->id,
            'email' => $user->email,
        ] : null;

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('suspension', $suspensionData);
    }
}