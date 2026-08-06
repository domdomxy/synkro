<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ProjectActivityLog extends Model
{
    protected $fillable = ['project_id', 'task_id', 'user_id', 'action', 'details'];
    protected $casts = ['details' => 'array'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * $task is optional - pass it for any action that's about a specific task so it
     * shows up in that task's own history panel, not just the project-wide log.
     */
    public static function log(Project $project, string $action, array $details = [], ?Task $task = null): self
    {
        return self::create([
            'project_id' => $project->id,
            'task_id' => $task?->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'details' => $details,
        ]);
    }
}
