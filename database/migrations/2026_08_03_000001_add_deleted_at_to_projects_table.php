<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Null = not in the trash. Set the moment an owner's deletion request is
            // confirmed (see ProjectController::confirmDeletion()) instead of removing
            // the row outright, so the project sits in the trash for
            // config('synkro.project_deletion_grace_days') days before
            // projects:purge-deleted forceDelete()s it for real. The project's own
            // tasks are soft-deleted alongside it (see Project::booted()) so the same
            // grace period covers both.
            $table->softDeletes()->after('deletion_email_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
