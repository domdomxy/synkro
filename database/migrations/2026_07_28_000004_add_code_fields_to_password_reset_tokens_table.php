<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The `token` column now stores a hashed 6-digit code instead of a long
     * random token, so it no longer carries its own implicit expiry the way
     * a signed URL would — we track that explicitly here, plus attempts so
     * a code can be locked out after repeated wrong guesses.
     */
    public function up(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempts')->default(0)->after('token');
            $table->timestamp('expires_at')->nullable()->after('attempts');
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_tokens', function (Blueprint $table) {
            $table->dropColumn(['attempts', 'expires_at']);
        });
    }
};
