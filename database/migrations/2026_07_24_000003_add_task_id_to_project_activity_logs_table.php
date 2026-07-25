<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_activity_logs', function (Blueprint $table) {
            // Nullable + set-null-on-delete: entries for actions not tied to a specific
            // task (e.g. project renamed, member removed) simply have no task_id, and a
            // task's history survives (with task_id cleared) if the task is later deleted,
            // rather than disappearing from the project-wide log.
            $table->foreignId('task_id')->nullable()->after('project_id')->constrained('tasks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_activity_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('task_id');
        });
    }
};
