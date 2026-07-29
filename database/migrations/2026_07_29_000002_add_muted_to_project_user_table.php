<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-user "mute this project's comment notifications" flag, alongside the
// existing pinned/archived per-user flags on project_user. Muting a project
// suppresses task_commented/task_mentioned/comment_replied (email + in-app)
// for every task in it, for this user only - same effect as muting each task
// individually, without having to do it one at a time.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->boolean('muted')->default(false)->after('archived');
        });
    }

    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->dropColumn('muted');
        });
    }
};
