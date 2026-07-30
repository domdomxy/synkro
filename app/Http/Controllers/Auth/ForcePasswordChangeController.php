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
     * with a temporary password an admin issued. Also re-shown on every
     * subsequent request to the protected app area (see
     * EnsurePasswordIsChanged) — there's no way past this until the user
     * actually sets a new password.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/ForcePasswordChange');
    }
}
