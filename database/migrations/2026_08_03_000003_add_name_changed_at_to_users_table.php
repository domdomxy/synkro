<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Set whenever the user actually changes their display name (see
            // AccountController::update). Used to enforce a 7-day cooldown
            // between name changes and to let the account form show when the
            // next change becomes available. Null means the name has never
            // been changed since account creation, so no cooldown applies yet.
            $table->timestamp('name_changed_at')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name_changed_at');
        });
    }
};
