<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Null = no deletion pending. Set when the owner requests deletion and a
            // confirmation email is sent; cleared on cancel; the project row itself is
            // removed once the owner confirms via the signed link, so this never needs
            // to be reset back to null on the "successful" path.
            $table->timestamp('deletion_requested_at')->nullable()->after('is_archived');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('deletion_requested_at');
        });
    }
};
