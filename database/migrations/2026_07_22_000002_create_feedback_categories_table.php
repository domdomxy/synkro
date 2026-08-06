<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_categories', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // stable identifier stored on feedbacks.category, never changes after creation
            $table->string('label');
            $table->string('icon')->default('dot'); // key into the frontend CategoryIcon preset list
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the categories admins start with. The first 6 used to be a hardcoded
        // enum on feedbacks.category; the last 3 (account_security, team_invitations,
        // notifications_emails) fill real gaps those didn't cover - each maps to an
        // actual feature area (see App\Support\EmailPreferences for the account/project
        // split, and ProjectMemberController/InvitationController for team invites)
        // rather than being invented from scratch. Admins can rename, re-icon, or
        // delete any of these later from Manage Categories, same as any other row.
        $now = now();
        DB::table('feedback_categories')->insert([
            ['key' => 'bug', 'label' => 'Bug Report', 'icon' => 'bug', 'sort_order' => 0, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'help', 'label' => 'Help Request', 'icon' => 'help', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'report', 'label' => 'Report User/Content', 'icon' => 'flag', 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'question', 'label' => 'Question', 'icon' => 'question', 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'suggestion', 'label' => 'Suggestion', 'icon' => 'lightbulb', 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'other', 'label' => 'Other', 'icon' => 'dot', 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'account_security', 'label' => 'Account & Security', 'icon' => 'lock', 'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'team_invitations', 'label' => 'Team & Invitations', 'icon' => 'users', 'sort_order' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'notifications_emails', 'label' => 'Notifications & Emails', 'icon' => 'mail', 'sort_order' => 8, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_categories');
    }
};
