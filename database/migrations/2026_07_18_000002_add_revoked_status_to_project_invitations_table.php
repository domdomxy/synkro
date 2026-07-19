<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE project_invitations MODIFY status ENUM('pending', 'accepted', 'denied', 'revoked') DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Revert any revoked rows to pending first so the narrower enum doesn't reject them.
        DB::table('project_invitations')->where('status', 'revoked')->update(['status' => 'pending']);
        DB::statement("ALTER TABLE project_invitations MODIFY status ENUM('pending', 'accepted', 'denied') DEFAULT 'pending'");
    }
};
