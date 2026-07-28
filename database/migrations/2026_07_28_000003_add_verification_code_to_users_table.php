<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Backs the email-verification-by-code flow (replaces the old signed-link
     * flow). The code itself is stored hashed, same as a password, so a
     * database leak doesn't hand out live codes.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_verification_code')->nullable()->after('email_verified_at');
            $table->timestamp('email_verification_code_expires_at')->nullable()->after('email_verification_code');
            $table->unsignedTinyInteger('email_verification_attempts')->default(0)->after('email_verification_code_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code',
                'email_verification_code_expires_at',
                'email_verification_attempts',
            ]);
        });
    }
};
