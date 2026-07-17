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
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('due_date')->nullable();
            $table->string('deliverable_path')->nullable();
            $table->timestamp('submitted_at')->nullable();
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
