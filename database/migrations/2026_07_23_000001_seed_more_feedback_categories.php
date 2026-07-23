<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * These three fill real gaps the original 6 categories didn't cover — each maps to an
     * actual feature area (see App\Support\EmailPreferences for the account/project split,
     * and ProjectMemberController/InvitationController for team invites) rather than being
     * invented from scratch. Admins can still rename, re-icon, or delete these later from
     * Manage Categories, same as any other row in this table.
     */
    public function up(): void
    {
        $startingSortOrder = (DB::table('feedback_categories')->max('sort_order') ?? -1) + 1;
        $now = now();

        DB::table('feedback_categories')->insert([
            [
                'key' => 'account_security',
                'label' => 'Account & Security',
                'icon' => 'lock',
                'sort_order' => $startingSortOrder,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'team_invitations',
                'label' => 'Team & Invitations',
                'icon' => 'users',
                'sort_order' => $startingSortOrder + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'notifications_emails',
                'label' => 'Notifications & Emails',
                'icon' => 'mail',
                'sort_order' => $startingSortOrder + 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('feedback_categories')->whereIn('key', ['account_security', 'team_invitations', 'notifications_emails'])->delete();
    }
};
