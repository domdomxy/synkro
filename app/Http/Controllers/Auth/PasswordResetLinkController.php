<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Email a 6-digit password reset code, then send the person on to the
     * code-entry screen. Unlike the old link-based flow this bypasses
     * Laravel's Password broker entirely so the code can be a short,
     * typeable number instead of a long opaque token.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ["We can't find a user with that email address."],
            ]);
        }

        $code = (string) random_int(100000, 999999);
        $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 15);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes($expireMinutes),
                'created_at' => now(),
            ]
        );

        $user->sendPasswordResetCodeNotification($code);

        return redirect()->route('password.reset', ['email' => $user->email])
            ->with('status', "We've emailed a 6-digit code to reset your password.");
    }
}
