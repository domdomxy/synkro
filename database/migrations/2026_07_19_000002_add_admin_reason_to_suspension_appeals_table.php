<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            // The admin's reason text, shown back on the appeal once decided instead
            // of only living transiently in the audit log / outgoing email.
            $table->text('admin_reason')->nullable()->after('outcome');
        });
    }

    public function down(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            $table->dropColumn('admin_reason');
        });
    }
};
