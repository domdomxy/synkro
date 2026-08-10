<?php

namespace App\Http\Controllers;

use App\Events\EmailPreferencesUpdated;
use App\Events\NotificationPreferencesUpdated;
use App\Models\SuspensionLog;
use App\Support\DeviceSessionData;
use App\Support\EmailPreferences;
use App\Support\NotificationPreferences;
use App\Support\TrashData;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit(Request $request)
    {
        $user = $request->user();

        $emailPrefs = array_merge(EmailPreferences::defaults($user), $user->email_preferences ?? []);
        $notificationPrefs = array_merge(NotificationPreferences::defaults($user), $user->notification_preferences ?? []);

        return Inertia::render('Settings', array_merge([
            'emailCatalog' => EmailPreferences::catalog($user),
            'emailPreferences' => $emailPrefs,
            'emailDefaults' => EmailPreferences::defaults($user),
            'notificationCatalog' => NotificationPreferences::catalog($user),
            'notificationPreferences' => $notificationPrefs,
            'notificationDefaults' => NotificationPreferences::defaults($user),
            'trustedLinkHosts' => $user->trusted_link_hosts ?? [],
            // Full trash listing, not just a summary - the Trash tab now
            // renders the actual restore/delete UI inline (see TrashSection.jsx)
            // instead of linking out to a separate /trash page.
            // Own suspension/appeal record, for the "Appeal History" settings
            // section (see AppealHistoryTimeline.jsx). A user reaching Settings
            // is by definition not currently blocked at login, but they may
            // still carry past suspensions/appeals, or have been suspended
            // again mid-session (is_suspended reflects that live).
            'appeals' => $user->appeals()->latest()->get(),
            'suspensionLogs' => SuspensionLog::where('user_id', $user->id)->with(['suspendedBy', 'liftedBy'])->latest()->get(),
            'isSuspended' => $user->is_suspended,
            'suspendedUntil' => $user->suspended_until?->toIso8601String(),
            'suspensionReason' => $user->suspension_reason,
        ], TrashData::forUser($user), DeviceSessionData::forUser($user, $request->session()->getId())));
    }

    public function updateEmailPreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'boolean',
        ]);

        $user = $request->user();
        $user->update(['email_preferences' => $validated['preferences']]);

        try {
            broadcast(new EmailPreferencesUpdated($user->id, $validated['preferences']))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Email preferences updated.');
    }

    public function updateNotificationPreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'boolean',
        ]);

        $user = $request->user();
        $user->update(['notification_preferences' => $validated['preferences']]);

        try {
            broadcast(new NotificationPreferencesUpdated($user->id, $validated['preferences']))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Notification preferences updated.');
    }
}