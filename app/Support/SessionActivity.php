<?php

namespace App\Support;

use App\Models\AccountActivityLog;
use Carbon\Carbon;

/**
 * Backs the "Session Activity" calendar on the user dashboard and the
 * "Website Sessions" card on the admin dashboard - same two-month grid,
 * same Max/Min/Avg pills, just scoped to one user vs the whole site. Kept
 * here so both controllers stay in sync instead of drifting apart.
 *
 * A session is counted on the day it started (a 'logged_in' row), not by
 * how long it ran - this widget only needs "how many sessions started
 * today", not per-session detail.
 */
class SessionActivity
{
    /**
     * Day-keyed session-start counts ('Y-m-d' => count) for the given range.
     * $userId null means site-wide (every user); otherwise scoped to one.
     */
    public static function countsByDay(?int $userId, Carbon $start, Carbon $end): array
    {
        $query = AccountActivityLog::where('action', 'logged_in')
            ->whereBetween('created_at', [$start, $end]);

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->get(['created_at'])
            ->groupBy(fn ($row) => Carbon::parse($row->created_at, 'UTC')->toDateString())
            ->map(fn ($rows) => $rows->count())
            ->toArray();
    }

    /**
     * Day-keyed per-user breakdown ('Y-m-d' => [...]) for the site-wide
     * (admin) calendar's day popover: who logged in the most that day, and
     * the min/max/avg session count across every user who logged in at all
     * that day. Not used by the per-user dashboard card, since "top user"
     * and "per-user avg" are meaningless when already scoped to one user.
     */
    public static function userBreakdownByDay(Carbon $start, Carbon $end): array
    {
        $rows = AccountActivityLog::where('action', 'logged_in')
            ->whereBetween('created_at', [$start, $end])
            ->with(['user:id,name,avatar_path'])
            ->get(['user_id', 'created_at']);

        $result = [];

        $rows->groupBy(fn ($row) => Carbon::parse($row->created_at, 'UTC')->toDateString())
            ->each(function ($dayRows, $day) use (&$result) {
                $perUser = $dayRows->groupBy('user_id');
                $counts = $perUser->map->count();

                if ($counts->isEmpty()) {
                    return;
                }

                $topUserId = $counts->sortDesc()->keys()->first();
                $topUser = $perUser[$topUserId]->first()->user;

                $result[$day] = [
                    'top_user' => $topUser ? [
                        'id' => $topUser->id,
                        'name' => $topUser->name,
                        'avatar_path' => $topUser->avatar_path,
                    ] : null,
                    'top_count' => (int) $counts->get($topUserId),
                    'min' => (int) $counts->min(),
                    'max' => (int) $counts->max(),
                    'avg' => round($counts->avg(), 1),
                ];
            });

        return $result;
    }

    /**
     * Resolves a "two months, most recent = $offset months back" window into
     * the Carbon range to query and the two month anchors themselves (older
     * first), so both dashboards' Prev/Next pagination stays identical.
     * $offset is clamped to 0 or above - 0 always means "this month and last".
     */
    public static function monthPairRange(int $offset): array
    {
        $offset = max(0, $offset);
        $newerMonth = now()->subMonths($offset)->startOfMonth();
        $olderMonth = now()->subMonths($offset + 1)->startOfMonth();

        return [
            'start' => $olderMonth->copy(),
            'end' => $newerMonth->copy()->endOfMonth(),
        ];
    }
}
