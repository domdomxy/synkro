<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Lets a note double as a to-do item: user can check it off without deleting it.
        Schema::table('project_notes', function (Blueprint $table) {
            $table->boolean('completed')->default(false)->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('project_notes', function (Blueprint $table) {
            $table->dropColumn('completed');
        });
    }
};
