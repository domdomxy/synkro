<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    /** Minimum gap between deletion-confirmation email sends, in seconds. */
    public const DELETION_EMAIL_COOLDOWN_SECONDS = 20;

    protected $fillable = ['name', 'description', 'owner_id','is_archived', 'deletion_requested_at', 'deletion_email_sent_at'];

    protected static function booted(): void
    {
        // A soft-deleted project's own tasks go into the trash alongside it, all
        // stamped with the exact same deleted_at so restoring() below can tell
        // "was trashed because its project was" apart from "was already independently
        // trashed before the project was" - only the former comes back automatically.
        static::deleting(function (Project $project) {
            if (! $project->isForceDeleting()) {
                $project->tasks()->whereNull('deleted_at')->update(['deleted_at' => $project->freshTimestamp()]);
            }
        });

        static::restoring(function (Project $project) {
            $project->tasks()->onlyTrashed()->where('deleted_at', $project->deleted_at)->restore();
        });
    }

    public function owner(): BelongsTo
    {
        // withTrashed(): an owner who deleted their account is still the owner
        // for the length of the grace period (confirmDeletion() deliberately
        // leaves owned projects untouched) — without this, the relation would
        // silently resolve to null the moment their account is soft-deleted,
        // even though owner_id and everything else is still intact.
        return $this->belongsTo(User::class, 'owner_id')->withTrashed();
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_user')->withPivot('role', 'pinned', 'archived', 'mute_in_app', 'mute_email')->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function roleFor(User $user): ?string
    {
        return $this->members()->where('user_id', $user->id)->first()?->pivot->role;
    }

    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /** Whether this user has muted comment notifications (in-app, email, or both) for every task in this project. */
    public function isMutedBy(User $user): bool
    {
        return $this->inAppMutedBy($user) || $this->emailMutedBy($user);
    }

    /** Whether this user has muted the in-app bell notification for every task in this project. */
    public function inAppMutedBy(User $user): bool
    {
        return (bool) $this->members()->where('user_id', $user->id)->first()?->pivot->mute_in_app;
    }

    /** Whether this user has muted the email notification for every task in this project. */
    public function emailMutedBy(User $user): bool
    {
        return (bool) $this->members()->where('user_id', $user->id)->first()?->pivot->mute_email;
    }
    public function invitations()
    {
        return $this->hasMany(ProjectInvitation::class);
    }
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ProjectActivityLog::class)->latest();
    }
    public function notes(): HasMany
    {
        return $this->hasMany(ProjectNote::class);
    }

    public function resources(): HasMany
    {
        return $this->hasMany(ProjectResource::class)->latest();
    }

    /** True while a deletion request is awaiting the owner's email confirmation. */
    public function hasPendingDeletion(): bool
    {
        return $this->deletion_requested_at !== null;
    }

    /** When the resend button becomes clickable again, or null if it's clickable now. */
    public function deletionEmailAvailableAt(): ?\Illuminate\Support\Carbon
    {
        if (! $this->deletion_email_sent_at) {
            return null;
        }

        $availableAt = $this->deletion_email_sent_at->addSeconds(self::DELETION_EMAIL_COOLDOWN_SECONDS);

        return $availableAt->isFuture() ? $availableAt : null;
    }

    public function canResendDeletionEmail(): bool
    {
        return $this->deletionEmailAvailableAt() === null;
    }

    /**
     * The moment this project becomes eligible for permanent purging by the
     * projects:purge-deleted scheduled command. Null if it isn't currently
     * sitting in the trash at all.
     */
    public function deletionGraceEndsAt(): ?\Illuminate\Support\Carbon
    {
        if (! $this->deleted_at) {
            return null;
        }

        return $this->deleted_at->copy()->addDays((int) config('synkro.project_deletion_grace_days', 7));
    }

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
            'deletion_requested_at' => 'datetime',
            'deletion_email_sent_at' => 'datetime',
        ];
    }

}
