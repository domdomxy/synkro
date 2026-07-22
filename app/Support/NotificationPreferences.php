<?php

namespace App\Support;

class NotificationPreferences
{
    /**
     * Categories shown in Settings' In-App Notifications section. 'administration'
     * is admin-only, mirroring EmailPreferences's admin-only 'admin' group.
     */
    public static function catalog(?\App\Models\User $user = null): array
    {
        $catalog = [
            'assignments' => 'Task assignments, updates, and deletions',
            'reviews' => 'Review requests and submission decisions',
            'membership' => 'Project invitations, role changes, and removals',
            'reminders' => 'Reminders you set going off',
        ];

        if ($user?->role === 'admin') {
            $catalog['administration'] = 'New tickets, new appeals, ticket replies, and feedback status changes';
        }

        return $catalog;
    }

    /** Flat map of category => default (all true unless overridden here). */
    public static function defaults(?\App\Models\User $user = null): array
    {
        return array_fill_keys(array_keys(self::catalog($user)), true);
    }

    /**
     * Maps each UserNotification 'type' value to the category it's gated by.
     * Kept in sync with NotificationBell.jsx's client-side categoryMap (used
     * there for filtering only; this is the server-side source of truth for
     * whether the notification gets created at all).
     */
    public static function typeCategoryMap(): array
    {
        return [
            'task_assigned' => 'assignments',
            'task_unassigned' => 'assignments',
            'task_updated' => 'assignments',
            'task_deleted' => 'assignments',
            'task_commented' => 'assignments',
            'task_approved' => 'reviews',
            'task_rejected' => 'reviews',
            'task_reopened' => 'reviews',
            'task_review_needed' => 'reviews',
            'task_done' => 'reviews',
            'member_left' => 'membership',
            'project_member_added' => 'membership',
            'project_role_changed' => 'membership',
            'removed_from_project' => 'membership',
            'project_invitation' => 'membership',
            'invitation_accepted' => 'membership',
            'invitation_denied' => 'membership',
            'reminder' => 'reminders',
            'feedback_replied' => 'administration',
            'admin_status_changed' => 'administration',
            'ticket_created' => 'administration',
            'appeal_created' => 'administration',
        ];
    }

    public static function wants(?\App\Models\User $user, string $category): bool
    {
        if (! $user) return true;
        $prefs = $user->notification_preferences ?? [];
        return $prefs[$category] ?? self::defaults($user)[$category] ?? true;
    }

    /**
     * Looks up the category for a notification 'type' and checks the user's
     * preference for it. Unmapped types (shouldn't normally happen) default
     * to true so nothing silently disappears because of a missing map entry.
     */
    public static function wantsType(?\App\Models\User $user, string $type): bool
    {
        $category = self::typeCategoryMap()[$type] ?? null;
        if ($category === null) return true;
        return self::wants($user, $category);
    }
}
