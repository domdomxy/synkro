<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['task_id', 'user_id', 'parent_id', 'body', 'is_feedback', 'is_rejection', 'is_reopened', 'edited_at'];

    // Deliberately NOT using Eloquent's SoftDeletes here: that trait hides the
    // row from every query by default (task->comments(), the recipient/mention
    // lookups, etc. would all need withTrashed() sprinkled in). deleted_at is
    // just a plain timestamp column instead - a tombstoned comment stays a
    // completely normal row everywhere except how the frontend renders its body.
    protected $appends = ['is_deleted'];

    protected $casts = [
        'is_feedback' => 'boolean',
        'is_rejection' => 'boolean',
        'is_reopened' => 'boolean',
        'edited_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function getIsDeletedAttribute(): bool
    {
        return ! is_null($this->deleted_at);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}