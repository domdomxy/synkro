<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\NotificationMailer;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use App\Models\Project;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'email', 'password', 'role', 'is_active', 'avatar_path', 'is_suspended', 'suspended_until',
    'suspension_reason', 'suspended_by', 'email_preferences', 'active_status_changed_at', 'role_changed_at',
    'must_change_password', 'temp_password_expires_at', 'notification_preferences',
    'deletion_requested_at', 'trusted_link_hosts', 'name_changed_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{   
    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class)->latest();
    }
    /** Superadmin has every admin permission plus a few of its own, so it counts as admin too. */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin'], true);
    }

    /** Role management (promote/demote admins), user deletion, and editing a user's core info are superadmin-only. */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')->withPivot('role', 'pinned', 'archived', 'mute_in_app', 'mute_email')->withTimestamps();
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }
    
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_suspended' => 'boolean',
            'suspended_until' => 'datetime',
            'email_preferences' => 'array',
            'must_change_password' => 'boolean',
            'temp_password_expires_at' => 'datetime',
            'notification_preferences' => 'array',
            'trusted_link_hosts' => 'array',
            'active_status_changed_at' => 'datetime',
            'role_changed_at' => 'datetime',
            'deletion_requested_at' => 'datetime',
            'restore_code_expires_at' => 'datetime',
            'admin_confirmation_code_expires_at' => 'datetime',
            'name_changed_at' => 'datetime',
        ];
    }
    public function pinnedTasks()
    {
        return $this->belongsToMany(Task::class, 'pinned_tasks');
    }

    /** Tasks whose comment notifications (in-app, email, or both) this user has muted. */
    public function mutedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_mutes')->withPivot('mute_in_app', 'mute_email')->withTimestamps();
    }
    public function suspendedBy()
    {
        return $this->belongsTo(User::class, 'suspended_by');
    }

    public function appeals()
    {
        return $this->hasMany(SuspensionAppeal::class);
    }

    public function isCurrentlySuspended(): bool
    {
        if (! $this->is_suspended) return false;
        // Permanent suspension (null suspended_until) never auto-expires here;
        // the scheduled job only clears timed suspensions.
        return true;
    }

    /**
     * Generate a fresh 6-digit email verification code, store it (hashed,
     * like a password) with a 10-minute expiry, and email it to the user.
     * Replaces the old signed-link flow: nothing here is clickable, the
     * person types the code back into the verify-email screen instead.
     */
    public function sendEmailVerificationNotification(): void
    {
        $code = (string) random_int(100000, 999999);
        $expireMinutes = 10;

        $this->forceFill([
            'email_verification_code' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes($expireMinutes),
            'email_verification_attempts' => 0,
        ])->save();

        NotificationMailer::send(
            $this,
            'account.email_verification',
            'Verify your email address',
            [
                'Thanks for signing up for Synkro! Enter the code below to confirm this is your email address and unlock full access to your account.',
                "This code expires in {$expireMinutes} minutes. If you didn't create a Synkro account, you can safely ignore this email.",
            ],
            null,
            null,
            [
                'label' => 'Verification code',
                'content' => $code,
                'mono' => true,
                'hint' => 'Tap and hold the code above to copy it, or select it manually.',
            ]
        );
    }

    /**
     * The moment this account becomes eligible for permanent purging by the
     * accounts:purge-deleted scheduled command. Null if the account isn't
     * currently in its post-deletion grace period at all.
     */
    public function deletionGraceEndsAt(): ?\Carbon\Carbon
    {
        if (! $this->deleted_at) {
            return null;
        }

        return $this->deleted_at->copy()->addDays((int) config('synkro.account_deletion_grace_days', 7));
    }

    /** When this user is next allowed to change their display name again. Null if they never have. */
    public function nameChangeAvailableAt(): ?\Carbon\Carbon
    {
        if (! $this->name_changed_at) {
            return null;
        }

        return $this->name_changed_at->copy()->addDays((int) config('synkro.name_change_cooldown_days', 7));
    }

    public function canChangeName(): bool
    {
        return $this->nameChangeAvailableAt()?->isPast() ?? true;
    }

    /** Still soft-deleted and inside the window where it can self-restore. */
    public function isRestorable(): bool
    {
        return $this->trashed() && (bool) $this->deletionGraceEndsAt()?->isFuture();
    }

    /**
     * Send the account deletion confirmation email. The account is not touched
     * until the user clicks this signed link, so requesting deletion (e.g. from
     * a hijacked or shared session) can't destroy the account by itself.
     */
    public function sendAccountDeletionConfirmationNotification(): void
    {
        $expireMinutes = 60;

        $confirmUrl = URL::temporarySignedRoute(
            'account.destroy.confirm',
            now()->addMinutes($expireMinutes),
            ['user' => $this->getKey()]
        );

        NotificationMailer::send(
            $this,
            'account.deletion_requested',
            'Confirm account deletion',
            [
                'We received a request to delete your Synkro account. Nothing has been deleted yet - confirming starts a grace period during which you can still restore it by logging back in.',
                "This link expires in {$expireMinutes} minutes. If you didn't request this, you can safely ignore this email and your account will stay exactly as it is.",
            ],
            $confirmUrl,
            'Confirm Account Deletion'
        );
    }

    /**
     * Generate a fresh 6-digit restore code for the self-service "your
     * account is scheduled for deletion" screen, store it (hashed, like a
     * password) with a 10-minute expiry, and email it. Replaces re-entering
     * the account password there, since the login attempt that landed the
     * person on that screen already proved password knowledge - this step
     * instead proves they still control the inbox.
     */
    public function sendAccountRestoreCodeNotification(): void
    {
        $code = (string) random_int(100000, 999999);
        $expireMinutes = 10;

        $this->forceFill([
            'restore_code' => Hash::make($code),
            'restore_code_expires_at' => now()->addMinutes($expireMinutes),
            'restore_code_attempts' => 0,
        ])->save();

        NotificationMailer::send(
            $this,
            'account.restore_code',
            'Your account restore code',
            [
                'Enter the code below to restore your Synkro account and everything in it, exactly as it was.',
                "This code expires in {$expireMinutes} minutes. If you didn't request this, you can safely ignore this email - your account will stay scheduled for deletion.",
            ],
            null,
            null,
            [
                'label' => 'Restore code',
                'content' => $code,
                'mono' => true,
                'hint' => 'Tap and hold the code above to copy it, or select it manually.',
            ]
        );
    }

    /**
     * Confirms a self-service restore during the deletion grace period.
     */
    public function sendAccountRestoredNotification(): void
    {
        NotificationMailer::send(
            $this,
            'account.restored',
            'Your account has been restored',
            [
                'Your Synkro account has been restored and is no longer scheduled for deletion.',
                "If you didn't do this, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately.',
            ]
        );
    }

    /**
     * Generate a fresh 6-digit step-up confirmation code for a superadmin about
     * to perform an irreversible admin action, and email it to their own
     * address (proving continued access to the inbox, on top of the session
     * they're already authenticated with). $purpose scopes the code to a
     * specific action - see verifyAdminConfirmationCode() below.
     */
    public function sendAdminConfirmationCodeNotification(string $purpose): void
    {
        $code = (string) random_int(100000, 999999);
        $expireMinutes = 10;

        $this->forceFill([
            'admin_confirmation_code' => Hash::make($code),
            'admin_confirmation_code_expires_at' => now()->addMinutes($expireMinutes),
            'admin_confirmation_code_attempts' => 0,
            'admin_confirmation_code_purpose' => $purpose,
        ])->save();

        NotificationMailer::send(
            $this,
            'account.admin_confirmation_code',
            'Your confirmation code',
            [
                'You (or someone signed into your admin account) requested a permanent, unrecoverable action on Synkro.',
                "Enter the code below to confirm it. This code expires in {$expireMinutes} minutes.",
                "If you didn't request this, secure your account immediately - change your password and review your active sessions.",
            ],
            null,
            null,
            [
                'label' => 'Confirmation code',
                'content' => $code,
                'mono' => true,
                'hint' => 'Tap and hold the code above to copy it, or select it manually.',
            ]
        );
    }

    /**
     * Verifies and consumes a step-up confirmation code issued for $purpose.
     * Returns null on success, or a user-facing error message otherwise. The
     * code is cleared both on success and once the attempt limit is hit, so
     * it can't be brute-forced or reused for a second action afterwards.
     */
    public function verifyAdminConfirmationCode(string $purpose, #[\SensitiveParameter] string $code): ?string
    {
        if (! $this->admin_confirmation_code || ! $this->admin_confirmation_code_expires_at || now()->greaterThan($this->admin_confirmation_code_expires_at)) {
            return 'This code has expired. Request a new one.';
        }

        if ($this->admin_confirmation_code_purpose !== $purpose) {
            return 'This code is not valid for this action. Request a new one.';
        }

        if ($this->admin_confirmation_code_attempts >= 5) {
            $this->clearAdminConfirmationCode();

            return 'Too many incorrect attempts. Request a new code.';
        }

        if (! Hash::check($code, $this->admin_confirmation_code)) {
            $this->increment('admin_confirmation_code_attempts');

            return 'The code you entered is incorrect.';
        }

        $this->clearAdminConfirmationCode();

        return null;
    }

    private function clearAdminConfirmationCode(): void
    {
        $this->forceFill([
            'admin_confirmation_code' => null,
            'admin_confirmation_code_expires_at' => null,
            'admin_confirmation_code_attempts' => 0,
            'admin_confirmation_code_purpose' => null,
        ])->save();
    }

    /**
     * Email a 6-digit password reset code, styled the same as every other
     * branded Synkro email. Called directly with a plaintext code by
     * PasswordResetLinkController (the code itself is hashed before it's
     * ever persisted) - this bypasses Laravel's link-based password broker
     * entirely, so unlike the old sendPasswordResetNotification() this isn't
     * invoked automatically by the framework.
     */
    public function sendPasswordResetCodeNotification(#[\SensitiveParameter] string $code): void
    {
        $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 15);

        NotificationMailer::send(
            $this,
            'account.password_reset',
            'Reset your password',
            [
                'You are receiving this email because we received a password reset request for your account.',
                "This code will expire in {$expireMinutes} minutes.",
                'If you did not request a password reset, no further action is required.',
            ],
            null,
            null,
            [
                'label' => 'Reset code',
                'content' => $code,
                'mono' => true,
                'hint' => 'Tap and hold the code above to copy it, or select it manually.',
            ]
        );
    }
}
