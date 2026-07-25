<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // is_feedback marks any comment tied to a review decision (approve or reject).
            // is_rejection narrows that down to "this is why it was sent back" so the UI can
            // stop mislabeling an approval note as "Requested changes".
            $table->boolean('is_rejection')->default(false)->after('is_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('is_rejection');
        });
    }
};
