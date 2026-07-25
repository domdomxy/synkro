<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskChecklistItem extends Model
{
    protected $fillable = ['task_id', 'title', 'done', 'position'];

    protected $casts = [
        'done' => 'boolean',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
