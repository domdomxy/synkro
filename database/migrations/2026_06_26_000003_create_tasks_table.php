<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable(); // rich text (HTML), sanitized in TaskController
            $table->string('status')->default('todo'); // todo | in_progress | submitted | in_review | done
            $table->string('priority')->default('medium'); // low | medium | high
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('due_date')->nullable();

            // Set once an overdue alert has been sent for the task's current due date,
            // so SendOverdueTaskAlerts doesn't re-notify every run. Cleared whenever the
            // due date changes (see TaskController::update) so a rescheduled task can
            // trigger a fresh alert if it goes overdue again.
            $table->timestamp('overdue_notified_at')->nullable();

            // Null = not in the trash. Set when a task is deleted directly (see
            // TaskController::destroy()) or cascaded from its project being trashed
            // (see Project::booted()). Sits in the trash for
            // config('synkro.task_deletion_grace_days') days before tasks:purge-deleted
            // forceDelete()s it for real.
            $table->softDeletes();

            $table->timestamp('submitted_at')->nullable();

            // Tracks when a task most recently entered "in_review", separately from
            // submitted_at (when it most recently entered "submitted"). The Testing
            // Queue's "Waiting" column uses whichever timestamp matches the task's
            // current status, so a task under active review shows how long the
            // reviewer has had it - not how long ago it was originally submitted.
            $table->timestamp('review_started_at')->nullable();

            $table->timestamp('edited_at')->nullable();
            $table->boolean('pending_resolution')->default(false); // awaiting manager review of a submitted change
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
