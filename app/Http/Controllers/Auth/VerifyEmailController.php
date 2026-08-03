<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\IntendedRedirect;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class VerifyEmailController extends Controller
{
    /**
     * Verify the authenticated user's email address using the 6-digit code
     * they were sent, rather than a signed link. Codes are hashed at rest
     * (like a password), so this always compares via Hash::check rather
     * than a plain string comparison.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return IntendedRedirect::to(route('projects.index', absolute: false).'?verified=1');
        }

        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        if (! $user->email_verification_code || ! $user->email_verification_code_expires_at || now()->greaterThan($user->email_verification_code_expires_at)) {
            throw ValidationException::withMessages([
                'code' => ['This code has expired. Request a new one below.'],
            ]);
        }

        if ($user->email_verification_attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => ['Too many incorrect attempts. Request a new code below.'],
            ]);
        }

        if (! Hash::check($request->code, $user->email_verification_code)) {
            $user->increment('email_verification_attempts');

            throw ValidationException::withMessages([
                'code' => ['The code you entered is incorrect.'],
            ]);
        }

        $user->forceFill([
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
            'email_verification_attempts' => 0,
        ]);

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return IntendedRedirect::to(route('projects.index', absolute: false).'?verified=1');
    }
}
