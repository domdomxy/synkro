<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class AccountActivityLog extends Model
{
    protected $fillable = ['user_id', 'action', 'details'];
    protected $casts = ['details' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * $userId defaults to the current auth'd user, but can be passed explicitly for flows
     * where the action isn't performed under an authenticated session (e.g. a password
     * reset completed via emailed token, where Auth::id() isn't available yet).
     */
    public static function log(string $action, array $details = [], ?int $userId = null): self
    {
        return self::create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'details' => $details,
        ]);
    }
}
