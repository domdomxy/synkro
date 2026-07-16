<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'owner_id','is_archived',];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_user')->withPivot('role', 'pinned', 'archived')->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function roleFor(User $user): ?string
    {
        return $this->members()->where('user_id', $user->id)->first()?->pivot->role;
    }

    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }
    public function invitations()
    {
        return $this->hasMany(ProjectInvitation::class);
    }
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ProjectActivityLog::class)->latest();
    }
    public function notes(): HasMany
    {
        return $this->hasMany(ProjectNote::class);
    }
    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

}