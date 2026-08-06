<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status', 
        'assigned_to', 
        'due_date',
        'submitted_at',
        'review_started_at',
        'edited_at',
        'pending_resolution',
        'overdue_notified_at',
        'priority',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'submitted_at' => 'datetime',
        'review_started_at' => 'datetime',
        'edited_at' => 'datetime',
        'pending_resolution' => 'boolean',
        'overdue_notified_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        // withTrashed(): a task cascade-trashed alongside its project (see
        // Project::booted()) still needs to resolve its project - for policy checks
        // (TaskPolicy relies on $task->project->roleFor()), for the Trash page listing,
        // and for restore()/forceDelete() - without this the relation would silently
        // go null the moment the parent project is soft-deleted too.
        return $this->belongsTo(Project::class)->withTrashed();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
    public function deliverables(): HasMany
    {
        return $this->hasMany(TaskDeliverable::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderBy('created_at');
    }
    public function pinnedBy()
    {
        return $this->belongsToMany(User::class, 'pinned_tasks');
    }

    /** Users who've muted comment notifications (in-app, email, or both) for this task. */
    public function mutedBy()
    {
        return $this->belongsToMany(User::class, 'task_mutes')->withPivot('mute_in_app', 'mute_email')->withTimestamps();
    }

    /** Whether $user has muted this task on the given channel ('in_app', 'email', or null for either). */
    public function isMutedBy(?User $user, ?string $channel = null): bool
    {
        if (! $user) return false;

        $pivot = $this->mutedBy()->where('users.id', $user->id)->first()?->pivot;

        if (! $pivot) return false;

        return match ($channel) {
            'in_app' => (bool) $pivot->mute_in_app,
            'email' => (bool) $pivot->mute_email,
            default => (bool) ($pivot->mute_in_app || $pivot->mute_email),
        };
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ProjectActivityLog::class)->latest();
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(TaskChecklistItem::class)->orderBy('position');
    }

    /** Tasks that THIS task depends on (must be done before this one can start). */
    public function dependencies()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'task_id', 'depends_on_task_id')->withTimestamps();
    }

    /** Tasks that depend on this one. */
    public function dependents()
    {
        return $this->belongsToMany(Task::class, 'task_dependencies', 'depends_on_task_id', 'task_id')->withTimestamps();
    }

    public function isBlocked(): bool
    {
        return $this->dependencies()->where('status', '!=', 'done')->exists();
    }

    /** Titles of dependencies that aren't done yet - what's actually blocking this task from starting. */
    public function blockingDependencyTitles()
    {
        return $this->dependencies()->where('status', '!=', 'done')->pluck('title');
    }

    /**
     * The moment this task becomes eligible for permanent purging by the
     * tasks:purge-deleted scheduled command. Null if it isn't currently
     * sitting in the trash at all.
     */
    public function deletionGraceEndsAt(): ?\Illuminate\Support\Carbon
    {
        if (! $this->deleted_at) {
            return null;
        }

        return $this->deleted_at->copy()->addDays((int) config('synkro.task_deletion_grace_days', 7));
    }
}