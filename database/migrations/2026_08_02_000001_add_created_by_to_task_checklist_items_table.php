<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_checklist_items', function (Blueprint $table) {
            // Nullable + set null on delete: existing items predate this column (no
            // creator to backfill), and a checklist item shouldn't disappear just
            // because the member who added it later left/was removed.
            $table->foreignId('created_by')->nullable()->after('task_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('task_checklist_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
