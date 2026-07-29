<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Splits the single "muted" flag (project_user) / mute row (task_mutes) into two
// independent channel flags, so a person can mute the in-app bell, the email, or
// both, instead of only having an all-or-nothing switch.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_mutes', function (Blueprint $table) {
            // Existing rows predate these columns and represented "muted, both
            // channels" - defaulting both to true keeps that behavior for them.
            $table->boolean('mute_in_app')->default(true)->after('task_id');
            $table->boolean('mute_email')->default(true)->after('mute_in_app');
        });

        Schema::table('project_user', function (Blueprint $table) {
            $table->boolean('mute_in_app')->default(false)->after('muted');
            $table->boolean('mute_email')->default(false)->after('mute_in_app');
        });

        // Backfill from the old combined flag before dropping it.
        DB::table('project_user')->where('muted', true)->update([
            'mute_in_app' => true,
            'mute_email' => true,
        ]);

        Schema::table('project_user', function (Blueprint $table) {
            $table->dropColumn('muted');
        });
    }

    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->boolean('muted')->default(false)->after('archived');
        });

        DB::table('project_user')
            ->where('mute_in_app', true)
            ->orWhere('mute_email', true)
            ->update(['muted' => true]);

        Schema::table('project_user', function (Blueprint $table) {
            $table->dropColumn(['mute_in_app', 'mute_email']);
        });

        Schema::table('task_mutes', function (Blueprint $table) {
            $table->dropColumn(['mute_in_app', 'mute_email']);
        });
    }
};
