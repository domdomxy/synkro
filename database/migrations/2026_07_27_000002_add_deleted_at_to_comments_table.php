<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Comments with replies are never hard-deleted - the row has to stay
            // so its children keep a valid parent_id and their place in the tree.
            // Deleting one of those instead stamps deleted_at and blanks the body,
            // and the frontend renders it as a "[original comment was deleted]"
            // tombstone. A comment with no replies still gets a real hard delete
            // (see CommentController::destroy), so this column stays null for the
            // vast majority of rows.
            $table->timestamp('deleted_at')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('deleted_at');
        });
    }
};
