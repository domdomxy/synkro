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

            // Which admin manually decided this appeal (reviewAppeal()) - left null
            // while pending, and left null when nobody decided it: auto-resolved
            // (lift-expired/newer-appeal-supersedes) or auto-closed for inactivity.
            // nullOnDelete so a reviewer who's later permanently purged doesn't take
            // the appeal's own history with them - see admin_logs for the same
            // reasoning.
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();

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
