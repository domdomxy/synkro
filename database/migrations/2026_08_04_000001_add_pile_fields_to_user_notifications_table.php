<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            // How many events have been folded into this single row - e.g. 5
            // separate comments on the same task collapse into one row with
            // pile_count = 5 instead of 5 near-identical bell notifications.
            // Starts at 1 for every notification, piled or not.
            $table->unsignedInteger('pile_count')->default(1)->after('type');

            // What this notification piles onto, e.g. "task:42" or "comment:17".
            // Scoped to (user_id, type) implicitly - two different types with the
            // same group_key never pile together, since a "commented" and a
            // "mentioned" notification for the same task are distinct signals.
            // Null for types that never pile (most of them - see NotificationPiler).
            $table->string('group_key')->nullable()->after('pile_count');

            $table->index(['user_id', 'type', 'group_key', 'read_at'], 'user_notifications_pile_lookup');
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex('user_notifications_pile_lookup');
            $table->dropColumn(['pile_count', 'group_key']);
        });
    }
};
