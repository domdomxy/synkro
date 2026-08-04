<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    protected $fillable = ['user_id', 'causer_id', 'message', 'url', 'read_at', 'type', 'pile_count', 'group_key'];
    protected $casts = ['read_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // The user who triggered this notification, if any - shown as an avatar
    // (with the type icon badged on top) in the bell dropdown and Notifications
    // page. Null for system-generated notifications (reminders, overdue alerts,
    // auto-closed tickets/appeals) that have no human actor.
    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }
}