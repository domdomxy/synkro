<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Resources can now be a pasted link in addition to an uploaded file,
     * mirroring the file/link split already used by task_deliverables.
     * File-only columns (original_name, path) become nullable since a link
     * resource won't have them; a new `url` column holds the link instead.
     */
    public function up(): void
    {
        Schema::table('project_resources', function (Blueprint $table) {
            $table->enum('type', ['file', 'link'])->default('file')->after('user_id');
            $table->string('url')->nullable()->after('path');
        });

        Schema::table('project_resources', function (Blueprint $table) {
            $table->string('original_name')->nullable()->change();
            $table->string('path')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('project_resources', function (Blueprint $table) {
            $table->dropColumn(['type', 'url']);
        });

        Schema::table('project_resources', function (Blueprint $table) {
            $table->string('original_name')->nullable(false)->change();
            $table->string('path')->nullable(false)->change();
        });
    }
};
