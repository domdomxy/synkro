<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackAttachment extends Model
{
    protected $fillable = ['feedback_id', 'path', 'original_name', 'size'];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }
}