<?php

namespace App\Support;

class EmailPreferences
{
    /**
     * Master list of every toggleable email key, grouped by category.
     * `always` = true means it ignores the user's preference (security-critical).
     */
    public static function catalog(): array
    {
        return [
            'account' => [
                'label' => 'Account',
                'items' => [
                    'account.email_changed' => 'Your email address was changed',
                    'account.password_changed' => 'Your password was changed',
                    'account.deactivated' => 'Your account was deactivated',
                    'account.deleted' => 'Your account was deleted',
                ],
            ],
            'project' => [
                'label' => 'Projects',
                'items' => [
                    'project.invitation_received' => 'Someone invited you to a project',
                    'project.invitation_accepted' => 'Your invitation was accepted',
                    'project.invitation_denied' => 'Your invitation was declined',
                    'project.removed' => 'You were removed from a project',
                    'project.edited' => 'A project you belong to was edited',
                    'project.ownership_transferred' => 'Project ownership was transferred to you',
                    'project.role_changed' => 'Your role in a project changed',
                ],
            ],
            'task' => [
                'label' => 'Tasks',
                'items' => [
                    'task.assigned' => 'A task was assigned to you',
                    'task.unassigned' => 'A task was taken away from you',
                    'task.updated' => 'A task assigned to you was updated',
                    'task.deleted' => 'A task assigned to you was deleted',
                    'task.review_needed' => 'A task is waiting for your review (testers)',
                    'task.approved' => 'Your submission was approved',
                    'task.rejected' => 'Your submission was sent back for changes',
                    'task.done' => 'A task you manage was marked done',
                ],
            ],
            'tickets' => [
                'label' => 'Feedback & Tickets',
                'items' => [
                    'tickets.responded' => 'Support responded to your ticket',
                    'tickets.status_changed' => 'Your ticket status changed (e.g. closed)',
                ],
            ],
            'reminders' => [
                'label' => 'Reminders',
                'items' => [
                    'reminders.due' => 'A reminder you set is due',
                ],
            ],
        ];
    }

    /** Flat map of key => default (all true unless overridden here). */
    public static function defaults(): array
    {
        $flat = [];
        foreach (self::catalog() as $group) {
            foreach ($group['items'] as $key => $label) {
                $flat[$key] = true;
            }
        }
        return $flat;
    }

    /** Keys that always send regardless of user preference. */
    public static function alwaysSend(): array
    {
        return [
            'account.password_reset',
            'account.suspended',
            'account.email_verification',
            'account.temp_password',
            'account.welcome',
            'account.suspension_lifted',
            'account.appeal_reviewed',
            'account.email_changed_security_alert',
        ];
    }

    public static function wants(?\App\Models\User $user, string $key): bool
    {
        if (! $user) return false;
        if (in_array($key, self::alwaysSend())) return true;

        $prefs = $user->email_preferences ?? [];
        return $prefs[$key] ?? self::defaults()[$key] ?? true;
    }
}