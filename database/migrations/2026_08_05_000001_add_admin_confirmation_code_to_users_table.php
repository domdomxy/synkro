<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Backs a step-up confirmation code superadmins must enter before an
     * irreversible admin action goes through (currently: permanently deleting
     * user accounts, bypassing the usual restore grace period). Stored on the
     * acting superadmin's own row, hashed like a password — same pattern as
     * restore_code, just scoped to whichever sensitive action requested it via
     * admin_confirmation_code_purpose, so a code issued for one action can't
     * be replayed to authorize a different one later.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('admin_confirmation_code')->nullable()->after('restore_code_attempts');
            $table->timestamp('admin_confirmation_code_expires_at')->nullable()->after('admin_confirmation_code');
            $table->unsignedTinyInteger('admin_confirmation_code_attempts')->default(0)->after('admin_confirmation_code_expires_at');
            $table->string('admin_confirmation_code_purpose')->nullable()->after('admin_confirmation_code_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'admin_confirmation_code',
                'admin_confirmation_code_expires_at',
                'admin_confirmation_code_attempts',
                'admin_confirmation_code_purpose',
            ]);
        });
    }
};
