<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A user can keep several personal notes per project (kebab menu), not just one.
        Schema::create('project_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');

            // Nullable + set-null-on-delete: a plain personal note (the original use
            // case) has no task at all, and a note that started life as "add task
            // checklist items to My Notes" (see TaskChecklistItemController::addToNotes)
            // shouldn't disappear just because the task it was copied from was later
            // deleted - it just stops being able to find a task to sync with.
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable();
            $table->text('content');
            $table->boolean('completed')->default(false); // lets a note double as a to-do item
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_notes');
    }
};
