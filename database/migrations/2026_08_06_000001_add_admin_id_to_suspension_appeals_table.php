<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which admin manually decided this appeal (reviewAppeal()) — left null
        // while pending, and left null when nobody decided it: auto-resolved
        // (lift-expired/newer-appeal-supersedes) or auto-closed for inactivity.
        // nullOnDelete so a reviewer who's later permanently purged doesn't take
        // the appeal's own history with them — see admin_logs for the same
        // reasoning.
        Schema::table('suspension_appeals', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_id');
        });
    }
};
