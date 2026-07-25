<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status', 
        'assigned_to', 
        'due_date',
        'submitted_at',
        'edited_at',
        'pending_resolution',
        'overdue_notified_at',
        'priority',
        'estimated_hours',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'edited_at' => 'datetime',
        'pending_resolution' => 'boolean',
        'overdue_notified_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
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

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ProjectActivityLog::class)->latest();
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(TaskChecklistItem::class)->orderBy('position');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TaskTimeLog::class)->latest('logged_date');
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
}