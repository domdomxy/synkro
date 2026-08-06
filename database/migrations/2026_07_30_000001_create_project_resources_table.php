<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Shared, project-level files or links (packages, sources, references, etc.) that
     * owners/managers drop in for members to use. Distinct from task_deliverables
     * (which are per-task submission output tied to the task lifecycle) - these live
     * at the project level, any type is accepted, and they can be edited or removed
     * at any time regardless of task state.
     */
    public function up(): void
    {
        Schema::create('project_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['file', 'link'])->default('file');
            $table->string('name');
            $table->text('description')->nullable();
            // File-only columns - nullable since a link resource won't have them.
            $table->string('original_name')->nullable();
            $table->string('path')->nullable();
            $table->string('url')->nullable(); // holds the link for a 'link' type resource
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_resources');
    }
};
