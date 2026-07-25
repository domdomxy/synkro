<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('repeat_interval')->nullable()->after('estimated_hours'); // null | daily | weekly | monthly
            $table->date('repeat_until')->nullable()->after('repeat_interval');
            $table->foreignId('parent_task_id')->nullable()->after('repeat_until')->constrained('tasks')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_task_id');
            $table->dropColumn(['repeat_interval', 'repeat_until']);
        });
    }
};
