<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class AdminLog extends Model
{
    protected $fillable = ['admin_id', 'action', 'description', 'reason', 'target_type', 'target_id'];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Record an administration action for the audit log.
     * $target is any Eloquent model the action was performed on (user, feedback, appeal, etc).
     * $reason is optional, admin-supplied free text (e.g. why a suspension was lifted) — kept
     * separate from $description so the UI can always show the summary while hiding the
     * (potentially long, sensitive, or user-quoted) reason until the log entry is expanded.
     */
    public static function log(string $action, string $description, ?Model $target = null, ?string $reason = null): self
    {
        return self::create([
            'admin_id' => Auth::id(),
            'action' => $action,
            'description' => $description,
            'reason' => $reason,
            'target_type' => $target ? class_basename($target) : null,
            'target_id' => $target?->getKey(),
        ]);
    }

    /** Human-readable groupings for the filter dropdown + badge colors on the Logs page. */
    public static function actionCatalog(): array
    {
        return [
            'user.suspended' => 'User suspended',
            'user.suspension_lifted' => 'Suspension lifted',
            'user.role_changed' => 'Role changed',
            'user.password_reset' => 'Password reset',
            'appeal.reviewed' => 'Appeal reviewed',
            'appeal.dismissed' => 'Appeal dismissed',
            'ticket.status_changed' => 'Ticket status changed',
            'ticket.responded' => 'Ticket responded to',
        ];
    }
}
