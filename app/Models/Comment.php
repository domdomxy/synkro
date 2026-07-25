<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = ['task_id', 'user_id', 'body', 'is_feedback', 'is_rejection', 'is_reopened', 'edited_at'];

    protected $casts = [
        'is_feedback' => 'boolean',
        'is_rejection' => 'boolean',
        'is_reopened' => 'boolean',
        'edited_at' => 'datetime',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}