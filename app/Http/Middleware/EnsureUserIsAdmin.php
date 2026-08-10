<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Deliberately a plain abort(403) with no custom message, for anyone who
     * isn't currently an admin - whether they never were one, or were
     * promoted and later demoted (e.g. following a stale "Promoted to
     * admin" notification link). There's no reliable way to tell those
     * apart that's worth the complexity, and guessing wrong would show a
     * message implying access they may never have had. See bootstrap/app.php
     * for the generic 403 copy this falls through to.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->isAdmin()) {
            abort(403);
        }

        return $next($request);
    }
}