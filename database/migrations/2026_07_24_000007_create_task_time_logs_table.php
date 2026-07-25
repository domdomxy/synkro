<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('hours', 5, 2);
            $table->string('note')->nullable();
            $table->date('logged_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_time_logs');
    }
};
