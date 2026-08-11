<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Who triggered this notification (for showing their avatar in the bell
            // dropdown / notifications page). Nullable - some notifications are
            // system-generated (reminders, overdue alerts, auto-closed tickets) and
            // have no human actor, so those fall back to the plain type icon.
            $table->foreignId('causer_id')->nullable()->constrained('users')->nullOnDelete();

            $table->text('message');
            $table->string('type')->default('task_assigned'); // drives icon/category in the bell dropdown

            // How many events have been folded into this single row - e.g. 5
            // separate comments on the same task collapse into one row with
            // pile_count = 5 instead of 5 near-identical bell notifications.
            // Starts at 1 for every notification, piled or not.
            $table->unsignedInteger('pile_count')->default(1);

            // What this notification piles onto, e.g. "task:42" or "comment:17".
            // Scoped to (user_id, type) implicitly - two different types with the
            // same group_key never pile together, since a "commented" and a
            // "mentioned" notification for the same task are distinct signals.
            // Null for types that never pile (most of them - see NotificationPiler).
            $table->string('group_key')->nullable();

            // Tracks the individual source record ids (currently: comment ids) folded
            // into a piled notification, e.g. [12, 15, 19] for a "You have 3 new
            // comments on ..." row. Lets a single source being deleted (a comment
            // removed) shrink the pile by exactly one instead of only being able to
            // delete the whole notification. Null for notification types that don't
            // track sources (most of them - see NotificationPiler::pile()).
            $table->json('source_ids')->nullable();

            $table->string('url')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'group_key', 'read_at'], 'user_notifications_pile_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
