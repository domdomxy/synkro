<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Nullable + set-null-on-delete: if the comment being replied to is
            // later deleted, the reply itself is left standing (comments are
            // otherwise never cascade-deleted just because another comment on
            // the same task disappears) - it just becomes a reply to nothing,
            // which the frontend renders as "Replying to a deleted comment".
            $table->foreignId('parent_id')->nullable()->after('user_id')
                ->constrained('comments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
