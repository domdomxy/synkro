<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSuperAdmin
{
    /**
     * Gates the handful of admin actions reserved for superadmins only: promoting/demoting
     * admins, deleting user accounts (single or bulk), and editing a user's email/core info.
     * Runs after the 'admin' middleware, which already guarantees an authenticated admin-or-
     * superadmin user, so this only needs to narrow that down further.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->isSuperAdmin()) {
            abort(403, "This action is restricted to superadmins.");
        }

        return $next($request);
    }
}
