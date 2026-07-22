<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\AccountActivityLog;
use App\Support\GeoLocator;
use App\Support\NotificationMailer;
use App\Support\UserAgentParser;
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

        $agent = UserAgentParser::parse($request->userAgent());
        $location = GeoLocator::locate($request->ip());

        AccountActivityLog::log('logged_in', [
            'browser' => $agent['browser'],
            'device' => $agent['device'],
            'os' => $agent['os'],
            'ip' => $request->ip(),
            'location' => $location,
        ]);

        // Recorded so destroy() below can compute the session's duration at logout.
        $request->session()->put('session_started_at', now()->toISOString());

        NotificationMailer::send(
            $user,
            'account.logged_in',
            'New login to your account',
            ["Your Synkro account was just signed in to."],
            null,
            null,
            [
                'label' => 'Login details',
                'content' => now()->format('M j, Y \a\t g:i A') . " (UTC)\n"
                    . "Location: " . ($location ?? 'Unknown') . "\n"
                    . "Device: {$agent['device']} · {$agent['os']}\n"
                    . "Browser: {$agent['browser']}\n"
                    . "IP address: {$request->ip()}",
            ],
            "If this wasn't you, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately and change your password.'
        );

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $sessionStartedAt = $request->session()->get('session_started_at');

        AccountActivityLog::log('logged_out', [
            'duration_seconds' => $sessionStartedAt
                ? now()->diffInSeconds(\Carbon\Carbon::parse($sessionStartedAt))
                : null,
        ]);

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