<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProjectInvitation extends Model
{
    protected $fillable = ['project_id', 'invited_user_id', 'invited_by', 'role', 'status', 'token'];

    protected static function booted()
    {
        static::creating(function ($invitation) {
            $invitation->token = $invitation->token ?? Str::random(48);
        });
    }

    public function project() { return $this->belongsTo(Project::class); }
    public function invitedUser() { return $this->belongsTo(User::class, 'invited_user_id'); }
    public function invitedBy() { return $this->belongsTo(User::class, 'invited_by'); }
}