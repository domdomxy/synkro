<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Set when the user requests account deletion from the danger zone.
            // The account itself is NOT deleted until the signed confirmation
            // link emailed to them is clicked (see AccountController::confirmDeletion).
            // Null means no deletion is currently pending.
            $table->timestamp('deletion_requested_at')->nullable()->after('active_status_changed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('deletion_requested_at');
        });
    }
};
