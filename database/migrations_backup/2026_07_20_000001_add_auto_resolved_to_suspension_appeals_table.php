<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            // True when this appeal was resolved by the suspensions:lift-expired
            // scheduled job (the suspension simply ran out) rather than by an admin
            // clicking Lift Suspension / Rejected. Lets the UI show "Approved
            // (automatically)" and skip attributing the decision to an admin.
            $table->boolean('auto_resolved')->default(false)->after('admin_reason');
        });
    }

    public function down(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            $table->dropColumn('auto_resolved');
        });
    }
};
