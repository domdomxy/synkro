<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_archived')->default(false);

            // Null = no deletion pending. Set when the owner requests deletion and a
            // confirmation email is sent; cleared on cancel; the project row itself is
            // removed once the owner confirms via the signed link, so this never needs
            // to be reset back to null on the "successful" path.
            $table->timestamp('deletion_requested_at')->nullable();

            // Separate from deletion_requested_at (which marks "pending since" and stays
            // put across resends) - this one moves forward on every resend and is what
            // the cooldown countdown is measured from.
            $table->timestamp('deletion_email_sent_at')->nullable();

            // Null = not in the trash. Set the moment an owner's deletion request is
            // confirmed (see ProjectController::confirmDeletion()) instead of removing
            // the row outright, so the project sits in the trash for
            // config('synkro.project_deletion_grace_days') days before
            // projects:purge-deleted forceDelete()s it for real. The project's own
            // tasks are soft-deleted alongside it (see Project::booted()) so the same
            // grace period covers both.
            $table->softDeletes();

            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
