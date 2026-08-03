<?php

namespace App\Support;

class NotificationPreferences
{
    /**
     * Categories shown in Settings' Notifications section. Deliberately mirrors
     * EmailPreferences::catalog()'s key names 1:1 (task.assigned, project.deleted,
     * etc.) wherever an in-app UserNotification actually exists for that event, so
     * Settings can render a single unified list with an email column and an in-app
     * column per row instead of two separately-grained sections. Events that only
     * ever send email (account.* security alerts, tickets.* for guest submitters
     * with no User account) are intentionally left out here - EmailPreferences is
     * the superset, this is the subset that also has a bell notification.
     * 'admin.*' is admin-only, mirroring EmailPreferences's admin-only 'admin' group.
     */
    public static function catalog(?\App\Models\User $user = null): array
    {
        $catalog = [
            'task.assigned' => 'A task was assigned to you',
            'task.unassigned' => 'A task was taken away from you',
            'task.updated' => 'A task assigned to you was updated',
            'task.deleted' => 'A task assigned to you was deleted',
            'task.commented' => 'Someone commented on a task assigned to you',
            'task.mentioned' => 'Someone @mentioned you or your role in a comment',
            'task.replied' => 'Someone replied to your comment',
            'task.checklist_item_added' => 'A checklist item was added to a task assigned to you',
            'task.checklist_item_updated' => 'A checklist item on a task assigned to you was edited',
            'task.checklist_item_deleted' => 'A checklist item on a task assigned to you was removed',
            'task.review_needed' => 'A task is waiting for your review (testers)',
            'task.approved' => 'Your submission was approved',
            'task.rejected' => 'Your submission was sent back for changes',
            'task.reopened' => 'A completed task was reopened for changes',
            'task.done' => 'A task you manage was marked done',
            'task.overdue' => 'A task assigned to you passed its due date',
            'project.invitation_received' => 'Someone invited you to a project',
            'project.invitation_accepted' => 'Your invitation was accepted',
            'project.invitation_denied' => 'Your invitation was declined',
            'project.member_added' => 'A new member joined a project you belong to',
            'project.member_left' => 'A member left a project you own or manage',
            'project.member_name_changed' => 'A member of a project you own or manage changed their display name',
            'project.owner_account_deleted' => "A project you belong to's owner deleted their account",
            'project.removed' => 'You were removed from a project',
            'project.edited' => 'A project you belong to was edited',
            'project.ownership_transferred' => 'Project ownership was transferred to you',
            'project.role_changed' => 'Your role in a project changed',
            'project.deletion_requested' => 'A project you belong to has a pending deletion request',
            'project.deleted' => 'A project you belonged to was deleted',
            'reminders.due' => 'A reminder you set is due',
            'account.password_changed' => 'Your password was changed',
            'account.email_changed' => 'Your email address was changed',
            'tickets.responded' => 'Support responded to your ticket',
            'tickets.status_changed' => 'Your ticket status changed (e.g. closed)',
        ];

        if (in_array($user?->role, ['admin', 'superadmin'], true)) {
            $catalog['admin.ticket_reply'] = 'A user replied to a ticket you responded to';
            $catalog['admin.ticket_created'] = 'A new feedback ticket was submitted';
            $catalog['admin.appeal_created'] = 'A new suspension appeal was submitted';
        }

        return $catalog;
    }

    /** Flat map of category => default (all true unless overridden here). */
    public static function defaults(?\App\Models\User $user = null): array
    {
        return array_fill_keys(array_keys(self::catalog($user)), true);
    }

    /**
     * Maps each UserNotification 'type' value to the granular EmailPreferences-style
     * key it's gated by (see catalog() above). Kept in sync with NotificationBell.jsx's
     * client-side categoryMap (which groups these same types into broad filter tabs
     * for the bell dropdown - a display-only concern, independent of this gating).
     */
    public static function typeCategoryMap(): array
    {
        return [
            'task_assigned' => 'task.assigned',
            'task_unassigned' => 'task.unassigned',
            'task_updated' => 'task.updated',
            'task_deleted' => 'task.deleted',
            'task_commented' => 'task.commented',
            'task_mentioned' => 'task.mentioned',
            'comment_replied' => 'task.replied',
            'task_checklist_item_added' => 'task.checklist_item_added',
            'task_checklist_item_updated' => 'task.checklist_item_updated',
            'task_checklist_item_deleted' => 'task.checklist_item_deleted',
            'task_approved' => 'task.approved',
            'task_rejected' => 'task.rejected',
            'task_reopened' => 'task.reopened',
            'task_review_needed' => 'task.review_needed',
            'task_done' => 'task.done',
            'task_overdue' => 'task.overdue',
            'member_left' => 'project.member_left',
            'member_name_changed' => 'project.member_name_changed',
            'owner_account_deleted' => 'project.owner_account_deleted',
            'project_member_added' => 'project.member_added',
            'project_role_changed' => 'project.role_changed',
            'removed_from_project' => 'project.removed',
            'project_invitation' => 'project.invitation_received',
            'invitation_accepted' => 'project.invitation_accepted',
            'invitation_denied' => 'project.invitation_denied',
            'project_updated' => 'project.edited',
            'project_ownership_transferred' => 'project.ownership_transferred',
            'project_deletion_requested' => 'project.deletion_requested',
            'project_deleted' => 'project.deleted',
            'reminder' => 'reminders.due',
            'feedback_replied' => 'admin.ticket_reply',
            'ticket_created' => 'admin.ticket_created',
            'appeal_created' => 'admin.appeal_created',
            'password_changed' => 'account.password_changed',
            'email_changed' => 'account.email_changed',
            'ticket_responded' => 'tickets.responded',
            'ticket_status_changed' => 'tickets.status_changed',
            // 'account_restored' has no toggle of its own, same reasoning as
            // 'admin_status_changed' above: its email counterpart
            // (account.restored) is in EmailPreferences::alwaysSend() since
            // it's security-relevant, so this is deliberately left unmapped
            // and falls through to wantsType()'s "always true" branch.
            // 'admin_status_changed' has no toggle of its own (there's no
            // EmailPreferences equivalent either - the accompanying emails,
            // account.admin_granted/admin_revoked, always send regardless of
            // preference since they're security-relevant). Deliberately left
            // unmapped so wantsType() falls through to its "always true" branch.
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
