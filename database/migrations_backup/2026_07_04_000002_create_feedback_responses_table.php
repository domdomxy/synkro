<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_id')->constrained('feedbacks')->onDelete('cascade');
            // Nullable: a response can come from the ticket submitter, not just an admin (see sender_type).
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('sender_type')->default('admin'); // admin | submitter
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_responses');
    }
};
