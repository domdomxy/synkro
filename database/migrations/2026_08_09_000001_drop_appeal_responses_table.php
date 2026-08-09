<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Removes the admin "Leave a Note" feature on pending appeals. A
     * still-suspended user can't reply to a note and can't submit another
     * appeal for 6 hours (see AppealRateLimiter), so a one-way note left
     * them stuck; admins should direct users to open a support ticket
     * instead, which they can do while suspended and which supports a real
     * back-and-forth.
     */
    public function up(): void
    {
        Schema::dropIfExists('appeal_responses');
    }

    public function down(): void
    {
        Schema::create('appeal_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appeal_id')->constrained('suspension_appeals')->onDelete('cascade');
            $table->foreignId('admin_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->timestamps();
        });
    }
};
