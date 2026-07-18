<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suspension state already has real timestamps via suspension_logs
     * (created_at / lifted_at), and email_verified_at already exists on
     * users. Active/inactive and role, however, had no record of *when*
     * they last changed — only their current value — so a trend % for
     * those cards was previously impossible to compute honestly.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('active_status_changed_at')->nullable()->after('is_active');
            $table->timestamp('role_changed_at')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['active_status_changed_at', 'role_changed_at']);
        });
    }
};
