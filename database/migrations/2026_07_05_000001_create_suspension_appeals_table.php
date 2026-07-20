<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suspension_appeals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->enum('status', ['pending', 'reviewed', 'dismissed'])->default('pending');
            // 'approved' | 'rejected' | null (null while pending).
            $table->string('outcome')->nullable();
            // The admin's reason text, shown back on the appeal once decided instead
            // of only living transiently in the audit log / outgoing email.
            $table->text('admin_reason')->nullable();
            // True when this appeal was resolved by the suspensions:lift-expired
            // scheduled job (the suspension simply ran out) rather than by an admin
            // clicking Lift Suspension / Rejected. Lets the UI show "Approved
            // (automatically)" and skip attributing the decision to an admin.
            $table->boolean('auto_resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suspension_appeals');
    }
};
