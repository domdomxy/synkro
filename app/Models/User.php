<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\NotificationMailer;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    'deletion_requested_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{   
    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class)->latest();
    }
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user')->withPivot('role', 'pinned', 'archived', 'muted')->withTimestamps();
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'owner_id');
    }
    
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

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
            'active_status_changed_at' => 'datetime',
            'role_changed_at' => 'datetime',
            'deletion_requested_at' => 'datetime',
        ];
    }
    public function pinnedTasks()
    {
        return $this->belongsToMany(Task::class, 'pinned_tasks');
    }

    /** Tasks whose comment notifications (email + in-app) this user has muted. */
    public function mutedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_mutes');
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
                'We received a request to permanently delete your Synkro account. Nothing has been deleted yet.',
                "This link expires in {$expireMinutes} minutes. If you didn't request this, you can safely ignore this email and your account will stay exactly as it is.",
            ],
            $confirmUrl,
            'Permanently Delete My Account'
        );
    }

    /**
     * Email a 6-digit password reset code, styled the same as every other
     * branded Synkro email. Called directly with a plaintext code by
     * PasswordResetLinkController (the code itself is hashed before it's
     * ever persisted) — this bypasses Laravel's link-based password broker
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
