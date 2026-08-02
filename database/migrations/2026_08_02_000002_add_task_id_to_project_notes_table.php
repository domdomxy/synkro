<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable + set null on delete: a plain personal checklist (the original
        // use case) has no task at all, and a note that started life as "add task
        // checklist items to My Notes" (see TaskChecklistItemController::addToNotes)
        // shouldn't disappear just because the task it was copied from was later
        // deleted - it just stops being able to find a task to sync with.
        Schema::table('project_notes', function (Blueprint $table) {
            $table->foreignId('task_id')->nullable()->after('project_id')
                ->constrained('tasks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('task_id');
        });
    }
};
