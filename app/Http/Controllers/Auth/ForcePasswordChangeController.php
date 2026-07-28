<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    /**
     * Show the "set a new password" prompt landed on right after signing in
     * with a temporary password an admin issued. This is only the redirect
     * target of a successful login (see AuthenticatedSessionController::store),
     * not something middleware re-checks on every request, so a user who
     * picks "Do it later" and continues into the app isn't interrupted again
     * until their next fresh login.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/ForcePasswordChange');
    }
}
