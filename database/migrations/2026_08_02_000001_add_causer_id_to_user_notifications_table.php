<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            // Who triggered this notification (for showing their avatar in the bell
            // dropdown / notifications page). Nullable - some notifications are
            // system-generated (reminders, overdue alerts, auto-closed tickets) and
            // have no human actor, so those fall back to the plain type icon.
            $table->foreignId('causer_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('causer_id');
        });
    }
};
