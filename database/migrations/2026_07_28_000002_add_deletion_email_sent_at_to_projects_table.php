<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Separate from deletion_requested_at (which marks "pending since" and stays
            // put across resends) - this one moves forward on every resend and is what
            // the cooldown countdown is measured from.
            $table->timestamp('deletion_email_sent_at')->nullable()->after('deletion_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('deletion_email_sent_at');
        });
    }
};
