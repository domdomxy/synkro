<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An admin-issued temporary password sets `must_change_password` on the user
 * and sends them to the force-change screen right after login (see
 * AuthenticatedSessionController::store / ForcePasswordChangeController).
 * That was previously only a one-time redirect: choosing "Do it later", or
 * navigating anywhere else directly (e.g. a bookmark, the welcome email,
 * browser history), left the rest of the app fully usable with the
 * still-temporary password never actually changed. This middleware re-checks
 * the flag on every request to the protected app area so the user is sent
 * back to the force-change screen until they actually set a new password
 * (`password.update`, which is what clears the flag).
 */
class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password && ! $request->routeIs('password.force-change', 'password.update', 'logout')) {
            return redirect()->route('password.force-change');
        }

        return $next($request);
    }
}
