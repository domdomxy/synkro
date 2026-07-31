<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Backs the OTP-based self-service account restore flow (replaces the
     * old "re-enter your password" step on the pending-deletion login
     * screen). The code is stored hashed, same as a password / the email
     * verification code, so a database leak doesn't hand out live codes.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('restore_code')->nullable()->after('deleted_at');
            $table->timestamp('restore_code_expires_at')->nullable()->after('restore_code');
            $table->unsignedTinyInteger('restore_code_attempts')->default(0)->after('restore_code_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'restore_code',
                'restore_code_expires_at',
                'restore_code_attempts',
            ]);
        });
    }
};
