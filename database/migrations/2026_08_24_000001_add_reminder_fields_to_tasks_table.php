<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // How long before due_date the assignee should be reminded. Null = no
            // reminder configured. Owner/manager-settable, same gate as due_date
            // itself (see TaskPolicy::edit()). Locked from further edits once the
            // task is done or its due date has already passed, unless due_date is
            // being changed in the same request - see TaskController::update().
            $table->unsignedInteger('reminder_offset_minutes')->nullable()->after('due_date');

            // Set once tasks:notify-deadline-reminders has fired for the task's
            // current due_date/reminder_offset_minutes pair, so it doesn't
            // re-notify every run. Cleared whenever either value changes (see
            // TaskController::update()), same pattern as overdue_notified_at.
            $table->timestamp('reminder_notified_at')->nullable()->after('overdue_notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['reminder_offset_minutes', 'reminder_notified_at']);
        });
    }
};
