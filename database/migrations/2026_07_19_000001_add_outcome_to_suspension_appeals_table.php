<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            // 'approved' | 'rejected' | null (null while pending, or for legacy rows
            // decided before this column existed — those are handled by falling back
            // to the old status values of 'reviewed'/'dismissed' in the UI).
            $table->string('outcome')->nullable()->after('status');
        });

        // Backfill outcome for appeals already decided under the old two-status scheme,
        // then collapse 'dismissed' into 'reviewed' so status only ever means
        // pending vs decided — the actual decision now lives in `outcome`.
        DB::table('suspension_appeals')->where('status', 'dismissed')->update(['outcome' => 'rejected']);
        DB::table('suspension_appeals')->where('status', 'reviewed')->update(['outcome' => 'approved']);
        DB::table('suspension_appeals')->where('status', 'dismissed')->update(['status' => 'reviewed']);
    }

    public function down(): void
    {
        Schema::table('suspension_appeals', function (Blueprint $table) {
            $table->dropColumn('outcome');
        });
    }
};
