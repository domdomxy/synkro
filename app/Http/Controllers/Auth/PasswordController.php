<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AccountActivityLog;
use App\Support\NotificationMailer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
            'temp_password_expires_at' => null,
        ]);

        AccountActivityLog::log('password_changed', [], $user->id);

        NotificationMailer::send(
            $user,
            'account.password_changed',
            'Your password was changed',
            ["Your Synkro account password was changed. If you didn't make this change, please contact support immediately."]
        );

        return back();
    }
}