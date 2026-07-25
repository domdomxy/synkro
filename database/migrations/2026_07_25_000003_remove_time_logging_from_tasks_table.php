<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Time logging feature removed. Drop the child table before the column
        // it referenced so nothing is left pointing at a dropped foreign key.
        Schema::dropIfExists('task_time_logs');

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('estimated_hours');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->decimal('estimated_hours', 6, 2)->nullable()->after('priority');
        });

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
};
