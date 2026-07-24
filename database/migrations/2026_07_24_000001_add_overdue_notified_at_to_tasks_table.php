<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Set once an overdue alert has been sent for the task's current due date,
            // so SendOverdueTaskAlerts doesn't re-notify every run. Cleared whenever the
            // due date changes (see TaskController::update) so a rescheduled task can
            // trigger a fresh alert if it goes overdue again.
            $table->timestamp('overdue_notified_at')->nullable()->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('overdue_notified_at');
        });
    }
};
