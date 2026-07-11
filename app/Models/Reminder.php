<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    protected $fillable = ['user_id', 'title', 'note', 'remind_at', 'dismissed', 'notified_at', 'repeat_interval'];
    protected $casts = ['remind_at' => 'datetime', 'dismissed' => 'boolean', 'notified_at' => 'datetime', 'repeat_interval' => 'string'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function notification(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserNotification::class, 'user_id', 'user_id')
            ->where('message', 'like', "⏰ Reminder: {$this->title}%");
    }
}


