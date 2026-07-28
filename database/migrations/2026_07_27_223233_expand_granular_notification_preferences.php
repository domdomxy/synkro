<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * NotificationPreferences::catalog() moved from broad categories (assignments,
 * reviews, membership, mentions, replies, reminders, administration) to granular
 * per-event keys that mirror EmailPreferences (task.assigned, project.deleted,
 * etc.) - see app/Support/NotificationPreferences.php. This backfills every
 * existing user's stored notification_preferences JSON so their old choice for
 * a broad category carries over to every granular key it used to cover, instead
 * of silently resetting to the (all-true) default.
 */
return new class extends Migration
{
    private const MAP = [
        'assignments' => ['task.assigned', 'task.unassigned', 'task.updated', 'task.deleted', 'task.commented', 'task.overdue'],
        'mentions' => ['task.mentioned'],
        'replies' => ['task.replied'],
        'reviews' => ['task.review_needed', 'task.approved', 'task.rejected', 'task.reopened', 'task.done'],
        'membership' => ['project.invitation_received', 'project.invitation_accepted', 'project.invitation_denied', 'project.member_added', 'project.member_left', 'project.removed', 'project.edited', 'project.ownership_transferred', 'project.role_changed', 'project.deleted'],
        'reminders' => ['reminders.due'],
        'administration' => ['admin.ticket_reply', 'admin.ticket_created', 'admin.appeal_created'],
    ];

    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('notification_preferences')
            ->select('id', 'notification_preferences')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $old = json_decode($user->notification_preferences, true);
                    if (! is_array($old) || empty($old)) continue;

                    $expanded = $old; // keep old keys too, harmless leftovers; new code only reads granular ones
                    foreach (self::MAP as $broadKey => $granularKeys) {
                        if (! array_key_exists($broadKey, $old)) continue;
                        foreach ($granularKeys as $granularKey) {
                            // Don't clobber a granular key the user may already have
                            // (shouldn't exist yet pre-migration, but safe either way).
                            if (! array_key_exists($granularKey, $expanded)) {
                                $expanded[$granularKey] = $old[$broadKey];
                            }
                        }
                    }

                    if ($expanded !== $old) {
                        DB::table('users')->where('id', $user->id)->update([
                            'notification_preferences' => json_encode($expanded),
                        ]);
                    }
                }
            });
    }

    public function down(): void
    {
        // Not reversed: the granular keys added here are harmless leftovers under
        // the old broad-category code (that code never reads them), so there's
        // nothing that needs cleaning up to safely roll back.
    }
};
