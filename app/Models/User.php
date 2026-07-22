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
use Illuminate\Support\Facades\URL;
use App\Models\Project;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'email', 'password', 'role', 'is_active', 'avatar_path', 'is_suspended', 'suspended_until',
    'suspension_reason', 'suspended_by', 'email_preferences', 'active_status_changed_at', 'role_changed_at',
    'must_change_password', 'temp_password_expires_at', 'notification_preferences',
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
        return $this->belongsToMany(Project::class, 'project_user')->withPivot('role', 'pinned', 'archived')->withTimestamps();
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
        ];
    }
    public function pinnedTasks()
    {
        return $this->belongsToMany(Task::class, 'pinned_tasks');
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
     * Send the branded Synkro verification email instead of Laravel's default
     * plain notification, so it matches every other outbound email.
     */
    public function sendEmailVerificationNotification(): void
    {
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(config('auth.verification.expire', 60)),
            [
                'id' => $this->getKey(),
                'hash' => sha1($this->getEmailForVerification()),
            ]
        );

        NotificationMailer::send(
            $this,
            'account.email_verification',
            'Verify your email address',
            [
                "Thanks for signing up for Synkro! Please confirm this is your email address to unlock your dashboard and get full access to your account.",
                'This link expires in 60 minutes. If you didn\'t create a Synkro account, you can safely ignore this email.',
            ],
            $verificationUrl,
            'Verify Email Address'
        );
    }

    /**
     * Send the branded Synkro password reset email instead of Laravel's default
     * plain notification, so it matches every other outbound email.
     */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $resetUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $this->getEmailForPasswordReset(),
        ], false));

        $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        NotificationMailer::send(
            $this,
            'account.password_reset',
            'Reset your password',
            [
                'You are receiving this email because we received a password reset request for your account.',
                "This password reset link will expire in {$expireMinutes} minutes.",
                'If you did not request a password reset, no further action is required.',
            ],
            $resetUrl,
            'Reset Password'
        );
    }
}
