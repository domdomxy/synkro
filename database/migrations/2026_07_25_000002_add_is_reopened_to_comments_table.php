<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // is_rejection means "a reviewer sent this back during review" (in_review -> in_progress).
            // is_reopened means "this task was already done, and got sent back after the fact"
            // (done -> in_progress). Both used to share is_rejection, which made a review rejection
            // and a post-completion reopen show up identically in the UI ("Requested changes"), even
            // though they're different points in the task's lifecycle worth telling apart.
            $table->boolean('is_reopened')->default(false)->after('is_rejection');
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('is_reopened');
        });
    }
};
