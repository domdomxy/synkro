<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;

/**
 * Thin wrapper around redirect()->intended() that discards the public
 * homepage ('/') if it's ever found sitting in session('url.intended').
 *
 * The homepage route carries no 'auth' middleware, so it should never be
 * the URL Laravel stashes there (that only happens when a guarded route
 * bounces an unauthenticated visitor to /login) - but when it does end up
 * there anyway, the effect is a freshly logged-in user getting sent right
 * back to the marketing page instead of the given $default (normally the
 * dashboard) or wherever they actually meant to go. Treating a root-path
 * intended URL as "no real intent" and falling back to $default fixes that
 * without changing the normal intended-URL behavior for every other page.
 */
class IntendedRedirect
{
    public static function to(string $default): RedirectResponse
    {
        $intended = session('url.intended');

        if ($intended && trim(parse_url($intended, PHP_URL_PATH) ?? '', '/') === '') {
            session()->forget('url.intended');
        }

        return redirect()->intended($default);
    }
}
