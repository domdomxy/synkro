<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Tracks when a task most recently entered "in_review", separately from
            // submitted_at (when it most recently entered "submitted"). The Testing
            // Queue's "Waiting" column uses whichever timestamp matches the task's
            // current status, so a task under active review shows how long the
            // reviewer has had it — not how long ago it was originally submitted.
            $table->timestamp('review_started_at')->nullable()->after('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('review_started_at');
        });
    }
};
