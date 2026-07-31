<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // user_id was `constrained()->onDelete('cascade')`, so purging an
        // account (User::forceDelete()) took every comment they'd ever left
        // with it - including ones sitting on a still-frozen (pending_resolution)
        // task that another member may still need the context of. Switch to
        // set-null so the row - and its body - survives; the frontend already
        // falls back to "Deleted user" for a null comment->user.
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Any comment currently orphaned by a purge (user_id NULL) would
        // violate the original NOT NULL constraint, so those rows are
        // deleted here to keep the rollback consistent with the old
        // cascade-delete behavior they'd have had all along.
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        \Illuminate\Support\Facades\DB::table('comments')->whereNull('user_id')->delete();

        Schema::table('comments', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
