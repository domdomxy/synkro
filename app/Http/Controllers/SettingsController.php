<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
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
        $notificationPrefs = array_merge(NotificationPreferences::defaults($user), $user->notification_preferences ?? []);

        return Inertia::render('Settings', [
            'emailCatalog' => EmailPreferences::catalog($user),
            'emailPreferences' => $emailPrefs,
            'emailDefaults' => EmailPreferences::defaults($user),
            'notificationCatalog' => NotificationPreferences::catalog($user),
            'notificationPreferences' => $notificationPrefs,
            'notificationDefaults' => NotificationPreferences::defaults($user),
            'trustedLinkHosts' => $user->trusted_link_hosts ?? [],
            'trashSummary' => $this->trashSummary($user),
        ]);
    }

    /**
     * Lightweight counterpart to TrashController::index() - just the count of
     * items this user can act on in the trash, plus the soonest purge date
     * among them, for the quick-glance card on the new Settings > Trash
     * panel. Deliberately mirrors TrashController's own scoping (owned
     * trashed projects, plus trashed tasks in projects the user owns or
     * manages whose project itself isn't trashed) so the count here always
     * matches what /trash actually lists - never fetching full rows since
     * this only needs a count and a min date.
     */
    private function trashSummary($user): array
    {
        $trashedProjects = Project::onlyTrashed()
            ->where('owner_id', $user->id)
            ->get(['id', 'deleted_at']);

        $managedProjectIds = $user->projects()
            ->wherePivotIn('role', ['owner', 'manager'])
            ->pluck('projects.id');

        $trashedTasks = Task::onlyTrashed()
            ->whereIn('project_id', $managedProjectIds)
            ->whereHas('project', fn ($query) => $query->whereNull('deleted_at'))
            ->get(['id', 'deleted_at']);

        $nextPurgeAt = $trashedProjects->concat($trashedTasks)
            ->map(fn ($model) => $model->deletionGraceEndsAt())
            ->filter()
            ->sort()
            ->first();

        return [
            'count' => $trashedProjects->count() + $trashedTasks->count(),
            'nextPurgeAt' => $nextPurgeAt,
        ];
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