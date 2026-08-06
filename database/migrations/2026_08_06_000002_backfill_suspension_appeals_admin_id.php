<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * suspension_appeals.admin_id (added in the previous migration) is only
     * ever set going forward, by reviewAppeal() and liftSuspension() - so
     * every appeal a human already decided before that column existed would
     * otherwise show up as "Deleted admin" (indistinguishable from an
     * actually-deleted reviewer) forever, which misrepresents what
     * happened. admin_logs already recorded who did it at the time
     * (AdminLog::log() stamps the acting admin on every 'appeal.reviewed' /
     * 'appeal.dismissed' entry), so recover it from there instead of
     * leaving it unknown.
     */
    public function up(): void
    {
        $reviewerByAppeal = DB::table('admin_logs')
            ->whereIn('action', ['appeal.reviewed', 'appeal.dismissed'])
            ->whereNotNull('admin_id')
            ->where('target_type', 'SuspensionAppeal')
            ->orderBy('created_at')
            ->get(['admin_id', 'target_id'])
            // Last log wins in the rare case an appeal shows up more than
            // once (it shouldn't - both review paths only act on a pending
            // appeal - but this is a one-off data fix, not worth a hard
            // assumption).
            ->reduce(function (array $carry, $log) {
                $carry[$log->target_id] = $log->admin_id;

                return $carry;
            }, []);

        foreach ($reviewerByAppeal as $appealId => $adminId) {
            DB::table('suspension_appeals')
                ->where('id', $appealId)
                ->whereNull('admin_id')
                ->where('auto_resolved', false)
                ->update(['admin_id' => $adminId]);
        }
    }

    public function down(): void
    {
        // Data backfill only - nothing to structurally reverse, and blanking
        // admin_id back out would just reintroduce the bug this fixes.
    }
};
