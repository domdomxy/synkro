<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_logs', function (Blueprint $table) {
            // Previously the admin-supplied reason was concatenated onto the end of
            // `description` (e.g. "Lifted suspension for X: <reason>"), which made it
            // impossible for the UI to show the summary while hiding the reason until
            // expanded. Storing it separately lets the frontend do that properly.
            $table->text('reason')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('admin_logs', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};
