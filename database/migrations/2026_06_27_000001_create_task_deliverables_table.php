<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_deliverables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['file', 'link']);

            // Optional, user-supplied label for link deliverables (e.g. "Staging build",
            // "Design mockup"), shown instead of the raw URL wherever the link is listed.
            $table->string('title')->nullable();

            $table->string('path')->nullable();
            $table->unsignedBigInteger('size')->nullable(); // file size in bytes, null for links
            $table->string('url')->nullable();
            $table->string('original_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_deliverables');
    }
};
