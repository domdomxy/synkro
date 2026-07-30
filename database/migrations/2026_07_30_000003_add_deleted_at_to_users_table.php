<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Powers the account-deletion grace period: confirmDeletion() now
            // soft-deletes (sets this column) instead of removing the row
            // outright, so the account can be self-restored for a few days
            // before accounts:purge-deleted permanently removes it.
            $table->softDeletes()->after('deletion_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
