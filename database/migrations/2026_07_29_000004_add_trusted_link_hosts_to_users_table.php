<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Hostnames the account has ticked "Trust ... links from now on"
            // for (see ExternalLinkGuard). Lives on the account - not the
            // browser - so it follows the person to every device/browser
            // they sign into, and never carries over to a different account
            // that happens to share the same browser. Null/empty means
            // nothing has been trusted yet.
            $table->json('trusted_link_hosts')->nullable()->after('notification_preferences');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('trusted_link_hosts');
        });
    }
};
