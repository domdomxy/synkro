<?php

namespace App\Http\Controllers;

use App\Support\EmailPreferences;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        $emailPrefs = array_merge(EmailPreferences::defaults($user), $user->email_preferences ?? []);
        $notificationPrefs = array_merge(NotificationPreferences::defaults(), $user->notification_preferences ?? []);

        return Inertia::render('Settings', [
            'emailCatalog' => EmailPreferences::catalog($user),
            'emailPreferences' => $emailPrefs,
            'notificationCatalog' => NotificationPreferences::catalog(),
            'notificationPreferences' => $notificationPrefs,
        ]);
    }

    public function updateEmailPreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'boolean',
        ]);

        $request->user()->update(['email_preferences' => $validated['preferences']]);

        return back()->with('success', 'Email preferences updated.');
    }

    public function updateNotificationPreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'boolean',
        ]);

        $request->user()->update(['notification_preferences' => $validated['preferences']]);

        return back()->with('success', 'Notification preferences updated.');
    }
}