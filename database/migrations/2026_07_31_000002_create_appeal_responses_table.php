<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mirrors feedback_responses, minus sender_type: unlike a feedback ticket, the
        // appellant can't reply here (they only ever get one message - the original
        // appeal), so every row is admin-authored. Existed so a supporter could leave
        // an interim note on a pending appeal without deciding it yet.
        //
        // Removed by 2026_08_09_000001_drop_appeal_responses_table.php - kept here
        // unmodified since this migration already shipped and ran in production.
        Schema::create('appeal_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appeal_id')->constrained('suspension_appeals')->onDelete('cascade');
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appeal_responses');
    }
};
