<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Reverses 2026_07_24_000008_add_recurrence_to_tasks_table.php. The repeating-task
// feature (a task auto-spawning its next occurrence on approval) has been removed,
// so the columns it needed go with it. Kept as its own migration rather than editing
// the original one, since that migration may already be applied elsewhere.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_task_id');
            $table->dropColumn(['repeat_interval', 'repeat_until']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('repeat_interval')->nullable()->after('estimated_hours'); // null | daily | weekly | monthly
            $table->date('repeat_until')->nullable()->after('repeat_interval');
            $table->foreignId('parent_task_id')->nullable()->after('repeat_until')->constrained('tasks')->nullOnDelete();
        });
    }
};
