<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Dead column: superseded by the task_deliverables table and never
            // read or written anywhere in the app. Confirmed via a full-repo grep
            // before dropping — only the migration and the model's $fillable
            // referenced it.
            $table->dropColumn('deliverable_path');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('deliverable_path')->nullable()->after('assigned_to');
        });
    }
};
