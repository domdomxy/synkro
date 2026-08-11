<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            // Tracks the individual source record ids (currently: comment ids)
            // folded into a piled notification, e.g. [12, 15, 19] for a "You
            // have 3 new comments on ..." row. Lets a single source being
            // deleted (a comment removed) shrink the pile by exactly one
            // instead of only being able to delete the whole notification.
            // Null for notification types that don't track sources (most of
            // them - see NotificationPiler::pile()).
            $table->json('source_ids')->nullable()->after('group_key');
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropColumn('source_ids');
        });
    }
};
