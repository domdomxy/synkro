<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Null = not in the trash. Set when a task is deleted directly (see
            // TaskController::destroy()) or cascaded from its project being trashed
            // (see Project::booted()). Sits in the trash for
            // config('synkro.task_deletion_grace_days') days before tasks:purge-deleted
            // forceDelete()s it for real.
            $table->softDeletes()->after('overdue_notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
