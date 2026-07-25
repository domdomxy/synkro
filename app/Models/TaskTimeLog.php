<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskTimeLog extends Model
{
    protected $fillable = ['task_id', 'user_id', 'hours', 'note', 'logged_date'];

    protected $casts = [
        'hours' => 'decimal:2',
        'logged_date' => 'date',
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
