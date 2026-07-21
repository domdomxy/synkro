<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            abort(403);
        }

        if (! $request->user()->isAdmin()) {
            // Covers stale "Promoted to admin" notifications/links: the user
            // may have been an admin when the link was generated (e.g. a
            // notification created at promotion time) but been demoted
            // since. Send them somewhere useful with an explanation instead
            // of a raw 403 error page.
            return redirect()
                ->route('dashboard')
                ->withErrors(['error' => 'Your administrator access has changed, so that page is no longer available to you.']);
        }

        return $next($request);
    }
}