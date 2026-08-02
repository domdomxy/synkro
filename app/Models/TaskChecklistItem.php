<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskChecklistItem extends Model
{
    protected $fillable = ['task_id', 'title', 'done', 'position', 'created_by'];

    protected $casts = [
        'done' => 'boolean',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    // Who added this item - shown next to it and used to let a tester remove
    // only the items they personally added (see TaskChecklistItemController).
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
