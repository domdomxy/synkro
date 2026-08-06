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
     * Day-keyed device-type breakdown ('Y-m-d' => [...]) for the per-user
     * dashboard calendar's day popover: which device type (Desktop/Mobile/
     * Tablet) was used most that day, and the min/max/avg session count
     * across every device type used at all that day. Mirrors
     * userBreakdownByDay's shape for the admin calendar, but grouped by
     * device instead of by user - "top user" is meaningless once already
     * scoped to a single person, but "top device" (and how sessions split
     * across whatever devices they logged in from) is the equivalent
     * scoped-down thing worth showing for that one day.
     */
    public static function deviceBreakdownByDay(int $userId, Carbon $start, Carbon $end): array
    {
        $rows = AccountActivityLog::where('action', 'logged_in')
            ->where('user_id', $userId)
            ->whereBetween('created_at', [$start, $end])
            ->get(['created_at', 'details']);

        $result = [];

        $rows->groupBy(fn ($row) => Carbon::parse($row->created_at, 'UTC')->toDateString())
            ->each(function ($dayRows, $day) use (&$result) {
                $perDevice = $dayRows->groupBy(fn ($row) => $row->details['device'] ?? 'Unknown Device');
                $counts = $perDevice->map->count();

                if ($counts->isEmpty()) {
                    return;
                }

                $topDevice = $counts->sortDesc()->keys()->first();

                $result[$day] = [
                    'top_device' => $topDevice,
                    'top_count' => (int) $counts->get($topDevice),
                    'min' => (int) $counts->min(),
                    'max' => (int) $counts->max(),
                    'avg' => round($counts->avg(), 1),
                ];
            });

        return $result;
    }

    /**
     * Day-keyed session-length stats ('Y-m-d' => ['min'=>secs,'avg'=>secs,'max'=>secs])
     * for the given range. $userId null means site-wide (every user, admin's
     * card); otherwise scoped to one (personal dashboard's card) - same split
     * as countsByDay.
     *
     * A session's length only becomes known once it ends ('logged_out', see
     * AuthenticatedSessionController::destroy()), so this walks the logout
     * timestamp back by its recorded duration_seconds to recover the day the
     * session actually *started* on, keeping the bucketing consistent with
     * countsByDay (which buckets by 'logged_in' day) rather than silently
     * switching to "day it ended" for this one stat. A session still open (no
     * matching logout yet) simply isn't counted here - there's nothing to
     * report a length for until it ends.
     */
    public static function durationStatsByDay(?int $userId, Carbon $start, Carbon $end): array
    {
        // A session that started within [$start, $end] can still log out
        // after $end, so the lookup window is widened forward by the
        // configured session lifetime (the longest a session can plausibly
        // run) rather than querying 'logged_out' rows strictly within
        // [$start, $end] - otherwise a session starting on the range's last
        // day would be dropped if it happened to log out just after it.
        $lookupEnd = $end->copy()->addMinutes((int) config('session.lifetime'));

        $query = AccountActivityLog::where('action', 'logged_out')
            ->whereNotNull('details->duration_seconds')
            ->whereBetween('created_at', [$start, $lookupEnd]);

        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        $startDate = $start->toDateString();
        $endDate = $end->toDateString();

        $byDay = $query->get(['created_at', 'details'])
            ->map(function ($row) {
                $durationSeconds = (int) $row->details['duration_seconds'];

                return [
                    'day' => Carbon::parse($row->created_at, 'UTC')->subSeconds($durationSeconds)->toDateString(),
                    'duration' => $durationSeconds,
                ];
            })
            ->filter(fn ($row) => $row['day'] >= $startDate && $row['day'] <= $endDate)
            ->groupBy('day');

        $result = [];

        $byDay->each(function ($dayRows, $day) use (&$result) {
            $durations = $dayRows->pluck('duration');

            $result[$day] = [
                'min' => (int) $durations->min(),
                'max' => (int) $durations->max(),
                'avg' => (int) round($durations->avg()),
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
