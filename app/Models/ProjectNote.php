<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectNote extends Model
{
    protected $fillable = ['project_id', 'user_id', 'title', 'content'];

    // A note is a checklist: content is a JSON array of {id, text, done} items,
    // stored in the existing text column. The array cast handles encode/decode.
    protected $casts = ['content' => 'array'];

    public function project(): BelongsTo { return $this->belongsTo(Project::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
