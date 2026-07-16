<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuspensionLog extends Model
{
    protected $fillable = ['user_id', 'suspended_by', 'reason', 'suspended_until', 'lifted_at', 'lifted_by'];
    protected $casts = ['suspended_until' => 'datetime', 'lifted_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function suspendedBy() { return $this->belongsTo(User::class, 'suspended_by'); }
    public function liftedBy() { return $this->belongsTo(User::class, 'lifted_by'); }
}