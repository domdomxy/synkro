<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_deliverables', function (Blueprint $table) {
            // Optional, user-supplied label for link deliverables (e.g. "Staging build",
            // "Design mockup"), shown instead of the raw URL wherever the link is listed.
            $table->string('title')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('task_deliverables', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
