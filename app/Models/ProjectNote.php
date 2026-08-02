<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectNote extends Model
{
    protected $fillable = ['project_id', 'user_id', 'task_id', 'title', 'content'];

    // A note is a checklist: content is a JSON array of {id, text, done,
    // checklist_item_id} items, stored in the existing text column. The array
    // cast handles encode/decode. checklist_item_id is null for a normal,
    // free-typed item and set when the item was copied in from a task's
    // checklist (see TaskChecklistItemController::addToNotes) - those items
    // stay mirrored with their source TaskChecklistItem's done state.
    protected $casts = ['content' => 'array'];

    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    // Set only for a note that started as "copy this task's checklist items
    // here" - lets TaskChecklistItemController find the right note to keep in
    // sync without scanning every note this person has.
    public function task(): BelongsTo { return $this->belongsTo(Task::class); }
}
