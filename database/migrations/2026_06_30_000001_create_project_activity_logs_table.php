<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');

            // Nullable + set-null-on-delete: entries for actions not tied to a specific
            // task (e.g. project renamed, member removed) simply have no task_id, and a
            // task's history survives (with task_id cleared) if the task is later deleted,
            // rather than disappearing from the project-wide log.
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();

            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action');
            $table->json('details')->nullable(); // before/after values shown in the collapsible log rows
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_activity_logs');
    }
};
