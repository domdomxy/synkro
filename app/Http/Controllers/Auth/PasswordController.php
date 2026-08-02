<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AccountActivityLog;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use App\Events\PasswordChanged;
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

        if (NotificationPreferences::wantsType($user, 'password_changed')) {
            $notification = UserNotification::create([
                'user_id' => $user->id,
                'type' => 'password_changed',
                'causer_id' => $user->id,
                'message' => "Password changed\nYour account password was changed. If this wasn't you, contact support immediately.",
                'url' => route('account.edit', [], false),
            ]);

            try {
                broadcast(new PasswordChanged($user->id, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back();
    }
}