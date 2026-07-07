<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Feedback extends Model
{
    protected $table = 'feedbacks';
    
    protected $fillable = [
        'name', 'email', 'category', 'subject',
        'message', 'status', 'tracking_id', 'attachment_path',
    ];

    protected static function booted(): void
    {
        static::creating(function (Feedback $feedback) {
            $feedback->tracking_id = strtoupper(Str::random(3) . '-' . Str::random(4) . '-' . Str::random(3));
        });
    }

    public function responses(): HasMany
    {
        return $this->hasMany(FeedbackResponse::class)->latest();
    }
    public function attachments()
    {
        return $this->hasMany(FeedbackAttachment::class);
    }
}