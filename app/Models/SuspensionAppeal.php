<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuspensionAppeal extends Model
{
    protected $fillable = ['user_id', 'admin_id', 'message', 'status', 'outcome', 'admin_reason', 'auto_resolved'];

    protected $casts = [
        'auto_resolved' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** The admin who manually decided this appeal via reviewAppeal() - null if still pending or auto-resolved. */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}