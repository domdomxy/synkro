<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-user, per-task mute of comment activity (task_commented, task_mentioned,
// comment_replied) - both the in-app bell notification and the email. Mirrors
// pinned_tasks: a simple pivot rather than a column on tasks, since "muted" is
// a relationship between a user and a task, not a property of the task itself.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_mutes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_mutes');
    }
};
