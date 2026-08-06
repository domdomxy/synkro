<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Set whenever the user actually changes their display name (see
            // AccountController::update). Used to enforce a 7-day cooldown
            // between name changes and to let the account form show when the
            // next change becomes available. Null means the name has never
            // been changed since account creation, so no cooldown applies yet.
            $table->timestamp('name_changed_at')->nullable();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();

            // Backs the email-verification-by-code flow. The code itself is stored
            // hashed, same as a password, so a database leak doesn't hand out live codes.
            $table->string('email_verification_code')->nullable();
            $table->timestamp('email_verification_code_expires_at')->nullable();
            $table->unsignedTinyInteger('email_verification_attempts')->default(0);

            $table->string('password');
            $table->rememberToken();

            // Global platform role, separate from the per-project role in project_user.
            $table->string('role')->default('user'); // user | admin
            $table->timestamp('role_changed_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('active_status_changed_at')->nullable();

            // Set when the user requests account deletion from the danger zone.
            // The account itself is NOT deleted until the signed confirmation
            // link emailed to them is clicked (see AccountController::confirmDeletion).
            // Null means no deletion is currently pending.
            $table->timestamp('deletion_requested_at')->nullable();

            $table->string('avatar_path')->nullable();

            // Notification opt-outs, keyed by event type; see EmailPreferences / NotificationPreferences.
            $table->json('email_preferences')->nullable();
            $table->json('notification_preferences')->nullable();

            // Hostnames the account has ticked "Trust ... links from now on" for (see
            // ExternalLinkGuard). Lives on the account, not the browser, so it follows
            // the person to every device/browser they sign into, and never carries over
            // to a different account that happens to share the same browser. Null/empty
            // means nothing has been trusted yet.
            $table->json('trusted_link_hosts')->nullable();

            // Suspension state (see also suspension_logs and suspension_appeals for history).
            $table->boolean('is_suspended')->default(false);
            $table->timestamp('suspended_until')->nullable();
            $table->text('suspension_reason')->nullable();
            $table->foreignId('suspended_by')->nullable()->constrained('users')->nullOnDelete();

            // Forced password reset flow (admin-issued temporary passwords).
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('temp_password_expires_at')->nullable();

            // Powers the account-deletion grace period: confirmDeletion() soft-deletes
            // (sets this column) instead of removing the row outright, so the account
            // can be self-restored for a few days before accounts:purge-deleted
            // permanently removes it.
            $table->softDeletes();

            // Backs the OTP-based self-service account restore flow. The code is stored
            // hashed, same as a password / the email verification code, so a database
            // leak doesn't hand out live codes.
            $table->string('restore_code')->nullable();
            $table->timestamp('restore_code_expires_at')->nullable();
            $table->unsignedTinyInteger('restore_code_attempts')->default(0);

            // Backs a step-up confirmation code superadmins must enter before an
            // irreversible admin action goes through (currently: permanently deleting
            // user accounts, bypassing the usual restore grace period). Stored on the
            // acting superadmin's own row, hashed like a password, same pattern as
            // restore_code, just scoped to whichever sensitive action requested it via
            // admin_confirmation_code_purpose, so a code issued for one action can't
            // be replayed to authorize a different one later.
            $table->string('admin_confirmation_code')->nullable();
            $table->timestamp('admin_confirmation_code_expires_at')->nullable();
            $table->unsignedTinyInteger('admin_confirmation_code_attempts')->default(0);
            $table->string('admin_confirmation_code_purpose')->nullable();

            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            // Stores a hashed 6-digit code instead of a long random token, so it no
            // longer carries its own implicit expiry the way a signed URL would - we
            // track that explicitly here, plus attempts so a code can be locked out
            // after repeated wrong guesses.
            $table->string('token');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
