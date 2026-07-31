<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppealResponse extends Model
{
    protected $table = 'appeal_responses';

    protected $fillable = ['appeal_id', 'admin_id', 'message'];

    public function appeal(): BelongsTo
    {
        return $this->belongsTo(SuspensionAppeal::class, 'appeal_id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
