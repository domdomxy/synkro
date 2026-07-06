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
        'deliverable_path', 
        'submitted_at',
        'edited_at',
        'pending_resolution'
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'edited_at' => 'datetime',
        'pending_resolution' => 'boolean',
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
}