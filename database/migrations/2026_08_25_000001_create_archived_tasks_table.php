<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mirrors pinned_tasks: archiving is per-user, not project-wide, same
        // as how Project archiving only hides a project from the archiving
        // member's own list (see project_user.archived) rather than affecting
        // every member. A task assigned to you that you archive stays exactly
        // as visible to everyone else.
        Schema::create('archived_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_tasks');
    }
};
