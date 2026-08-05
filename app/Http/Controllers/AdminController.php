<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SuspensionAppeal;
use App\Models\Task;
use App\Models\User;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\Feedback;
use App\Events\UserSuspended;
use App\Events\PasswordResetByAdmin;
use App\Events\AdminStatusChanged;
use App\Models\SuspensionLog;
use App\Models\AdminLog;
use App\Models\UserNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use App\Mail\SynkroNotificationMail;
use App\Events\EmailChanged;
use App\Support\AccountDeletion;

class AdminController extends Controller
{
    /**
     * Clamp the requested page size to a sane range so custom values can't be
     * used to pull an unbounded number of rows in one request.
     */
    private function perPage(Request $request, int $default): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return max(1, min($perPage, 500));
    }

    /**
     * Real month-over-month change for an already-scoped query (e.g. "currently active
     * users"), based on a timestamp column that records when a row entered that scope
     * (active_status_changed_at, role_changed_at, a log table's created_at, etc). Mirrors
     * the created_at-based growth rate in dashboard(), generalized to work with any query
     * + column instead of being hardcoded to a model's created_at.
     */
    private function monthOverMonthChange($query, string $column): array
    {
        $startOfMonth = now()->startOfMonth();
        // Clone before each count — the same builder can't be reused across two different
        // where() calls without the second corrupting the first's conditions.
        $before = (clone $query)->where($column, '<', $startOfMonth)->count();
        $thisMonth = (clone $query)->where($column, '>=', $startOfMonth)->count();
        // Real percent CHANGE (delta over the prior baseline), not thisMonth expressed
        // as a percent of before. The old formula (thisMonth / before * 100) reported
        // e.g. "100%" whenever thisMonth == before, i.e. "no change" was shown as a
        // doubling. With no baseline to compare against, there's nothing to compute a
        // change from, so 0 new this month reads as "0%" and any new activity reads
        // as "100%" (a fresh trend, not literally "grew by 100%").
        $change = $before > 0
            ? round(($thisMonth - $before) / $before * 100, 1)
            : ($thisMonth > 0 ? 100.0 : 0.0);

        return ['change' => $change];
    }

    /**
     * Safe replacement for range(0, $count). PHP 8.3 throws a ValueError from
     * range() when $count is 0 (step 1 is no longer "less than" a zero span),
     * which happens whenever a custom date range covers a single day/week/month.
     */
    private function indices(int $count): array
    {
        return $count > 0 ? range(0, $count) : [0];
    }

    private function buckets(string $range, ?string $from = null, ?string $to = null): array
    {
        if ($range === 'custom' && $from && $to) {
            $start = \Carbon\Carbon::parse($from)->startOfDay();
            $end = \Carbon\Carbon::parse($to)->endOfDay();
            $totalDays = $start->diffInDays($end);
            $spansMultipleYears = $start->year !== $end->year;

            if ($totalDays <= 31) {
                // Daily buckets
                return array_map(function ($d) use ($start, $spansMultipleYears) {
                    $day = $start->copy()->addDays($d);
                    return [
                        'label' => $day->format($spansMultipleYears ? 'M j, Y' : 'M j'),
                        'start' => $day->copy()->startOfDay(),
                        'end' => $day->copy()->endOfDay(),
                    ];
                }, $this->indices($totalDays));
            }

            if ($totalDays <= 180) {
                // Weekly buckets
                $weeks = (int) ceil($totalDays / 7);
                return array_map(function ($w) use ($start, $end, $spansMultipleYears) {
                    $weekStart = $start->copy()->addWeeks($w);
                    $weekEnd = min($weekStart->copy()->addDays(6)->endOfDay(), $end);
                    return [
                        'label' => $weekStart->format($spansMultipleYears ? 'M j, Y' : 'M j'),
                        'start' => $weekStart->copy()->startOfDay(),
                        'end' => $weekEnd,
                    ];
                }, $this->indices($weeks));
            }

            // Monthly buckets for long ranges
            $months = $start->diffInMonths($end);
            return array_map(function ($m) use ($start, $end) {
                $monthStart = $start->copy()->addMonths($m)->startOfMonth();
                $monthEnd = min($monthStart->copy()->endOfMonth(), $end);
                return [
                    'label' => $monthStart->format('M Y'),
                    'start' => $monthStart,
                    'end' => $monthEnd,
                ];
            }, $this->indices($months));
        }

        return match ($range) {
            'today' => array_map(fn ($h) => [
                'label' => now()->subHours(23 - $h)->format('ga'),
                'start' => now()->subHours(23 - $h)->startOfHour(),
                'end' => now()->subHours(23 - $h)->endOfHour(),
            ], range(0, 23)),
            'month' => array_map(fn ($d) => [
                'label' => now()->subDays(29 - $d)->format('M j'),
                'start' => now()->subDays(29 - $d)->startOfDay(),
                'end' => now()->subDays(29 - $d)->endOfDay(),
            ], range(0, 29)),
            default => array_map(fn ($d) => [
                'label' => now()->subDays(6 - $d)->format('D'),
                'start' => now()->subDays(6 - $d)->startOfDay(),
                'end' => now()->subDays(6 - $d)->endOfDay(),
            ], range(0, 6)),
        };
    }

    public function dashboard()
    {
        $range = request('range', 'week');
        $tasksByStatus = Task::query()->selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');

        // Completion-time proxy for a fully-done project: projects have no
        // dedicated "completed_at" column, so - same reasoning as the "done"
        // tasks trend elsewhere - the latest updated_at among a project's own
        // tasks stands in for the moment it became fully complete. Computed
        // once up front (one query) rather than per bucket.
        $completedProjectTimes = Project::whereHas('tasks')
            ->whereDoesntHave('tasks', fn ($q) => $q->where('status', '!=', 'done'))
            ->withMax('tasks', 'updated_at')
            ->get()
            ->pluck('tasks_max_updated_at')
            ->filter()
            ->map(fn ($t) => \Carbon\Carbon::parse($t));

        $chartData = array_map(function ($bucket) use ($completedProjectTimes) {
            return [
                'label' => $bucket['label'],
                'completed' => Task::where('status', 'done')->whereBetween('updated_at', [$bucket['start'], $bucket['end']])->count(),
                'created' => Task::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
                'submitted' => Task::whereNotNull('submitted_at')->whereBetween('submitted_at', [$bucket['start'], $bucket['end']])->count(),
                'newUsers' => User::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
                'newProjects' => Project::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
                'completedProjects' => $completedProjectTimes->filter(fn ($t) => $t->between($bucket['start'], $bucket['end']))->count(),
            ];
        }, $this->buckets($range, request('from'), request('to')));

        $activityTotals = [
            'completed' => array_sum(array_column($chartData, 'completed')),
            'created' => array_sum(array_column($chartData, 'created')),
            'submitted' => array_sum(array_column($chartData, 'submitted')),
            'projects' => array_sum(array_column($chartData, 'newProjects')),
        ];
        $recentUsers = User::latest()->limit(5)->get();
        $recentProjects = Project::with('owner')->latest()->limit(5)->get();

        // Growth rate and "new this month" are derived purely from created_at timestamps we
        // already store, so these are real numbers, not fabricated trend data. We only have
        // creation dates, not historical snapshots of is_active/is_suspended/role/etc, so a
        // trend % is only honest for counts that are purely additive over time (users,
        // projects, tasks) — not for the active/inactive/suspended/admin breakdowns.
        $startOfMonth = now()->startOfMonth();

        // Deletions this month, read off whichever rows still show a deleted_at right now.
        // Once something's been soft-deleted *and* since purged past its grace period, its
        // deleted_at becomes unqueryable (the row's gone for good) — so a deletion from
        // early this month that's already been purged quietly stops counting here. An
        // accepted, honest gap given grace periods (a handful of days) are short relative
        // to a month; a fully gapless count would need a permanent deletion-events log this
        // app doesn't have. Accounts an admin deleted *permanently* (skips the grace period
        // and soft-delete step entirely — see AdminController::destroy()) leave no deleted_at
        // at all, so those are added back in separately from the admin log below.
        $deletionsThisMonth = fn (string $model) => $model::onlyTrashed()->whereBetween('deleted_at', [$startOfMonth, now()])->count();

        $permanentUserDeletionsThisMonth = AdminLog::where('action', 'user.deleted_permanent')
            ->whereBetween('created_at', [$startOfMonth, now()])
            ->count();

        // Net change (creations minus departures) as a % of where the count stood at the
        // start of the month — unlike a pure creation-count trend, this can go negative
        // when deletions outpace new signups/projects/tasks in a given month.
        //
        // The baseline ("how many existed at the start of this month") deliberately uses
        // withTrashed(): a plain where(created_at < startOfMonth) count would shrink every
        // time something soft-deleted this month gets purged out of the table, or the moment
        // an admin permanently deletes it — both make the row disappear from that count too,
        // on top of it already being subtracted as a departure, silently exaggerating the
        // negative rate (9 members, 2 permanently deleted, 0 new => a naive count-based
        // baseline drops to 7 and reports -2/7 = -29%, when the real answer against last
        // month's actual 9 is -2/9 = -22%). $extraBaseline adds back anyone who existed at
        // the start of the month but has since been forceDelete()'d with literally no row
        // left at all (only relevant for users right now, via permanentUserDeletionsThisMonth
        // above — accepted approximation: assumes they were around before this month, which
        // is true except in the rare case of a same-month signup immediately followed by an
        // admin permanently deleting them).
        $netGrowthRate = function (string $model, int $removedThisMonth = 0, int $extraBaseline = 0) use ($startOfMonth) {
            $before = $model::withTrashed()->where('created_at', '<', $startOfMonth)->count() + $extraBaseline;
            $netThisMonth = $model::where('created_at', '>=', $startOfMonth)->count() - $removedThisMonth;

            if ($before <= 0) {
                return $netThisMonth > 0 ? 100.0 : ($netThisMonth < 0 ? -100.0 : 0.0);
            }

            return round($netThisMonth / $before * 100, 1);
        };

        $newUsersThisMonth = User::where('created_at', '>=', $startOfMonth)->count();
        $userGrowthRate = $netGrowthRate(User::class, $deletionsThisMonth(User::class) + $permanentUserDeletionsThisMonth, $permanentUserDeletionsThisMonth);
        $projectGrowthRate = $netGrowthRate(Project::class, $deletionsThisMonth(Project::class));
        $taskGrowthRate = $netGrowthRate(Task::class, $deletionsThisMonth(Task::class));


        // We don't track session start/end times, so a true "average session length" isn't
        // computable from the sessions table (it only has last_activity). "Currently online"
        // (active in the last 5 minutes) is the closest honest, real metric available.
        $currentlyOnline = DB::table('sessions')->where('last_activity', '>=', now()->subMinutes(5)->timestamp)->count();

        // A project counts as "completed" once every task in it is done. Projects with zero
        // tasks are excluded since "all zero tasks are done" would be trivially true otherwise.
        $completedProjects = Project::whereHas('tasks')
            ->whereDoesntHave('tasks', fn ($q) => $q->where('status', '!=', 'done'))
            ->count();

        $alertCounts = \App\Support\AdminAlerts::counts();

        // Site-wide counterpart to the user dashboard's "Session Activity" card -
        // same two-month grid and counting logic (App\Support\SessionActivity), just
        // across every user instead of one.
        $websiteSessionOffset = max(0, (int) request('website_session_offset', 0));
        $websiteSessionRange = \App\Support\SessionActivity::monthPairRange($websiteSessionOffset);
        $websiteSessionActivity = \App\Support\SessionActivity::countsByDay(null, $websiteSessionRange['start'], $websiteSessionRange['end']);

        return Inertia::render('Admin/Dashboard', [
            'range' => $range,
            'customFrom' => request('from'),
            'customTo' => request('to'),
            'stats' => [
                'users' => User::count(),
                'activeUsers' => User::where('is_active', true)->where('is_suspended', false)->count(),
                'inactiveUsers' => User::where('is_active', false)->count(),
                'suspendedUsers' => User::where('is_suspended', true)->count(),
                'admins' => User::where('role', 'admin')->count(),
                'projects' => Project::count(),
                'completedProjects' => $completedProjects,
                'tasks' => Task::count(),
                'tasksByStatus' => $tasksByStatus,
                'chartData' => $chartData,
                'activityTotals' => $activityTotals,
                'recentUsers' => $recentUsers,
                'recentProjects' => $recentProjects,
                'pendingResolution' => Task::where('pending_resolution', true)->count(),
                'pendingAppeals' => $alertCounts['pendingAppeals'],
                'pendingFeedbacks' => $alertCounts['pendingFeedbacks'],
                'newUsersThisMonth' => $newUsersThisMonth,
                'userGrowthRate' => $userGrowthRate,
                'projectGrowthRate' => $projectGrowthRate,
                'taskGrowthRate' => $taskGrowthRate,
                'currentlyOnline' => $currentlyOnline,
                'websiteSessionActivity' => $websiteSessionActivity,
                'websiteSessionOffset' => $websiteSessionOffset,
            ],
        ]);
    }

    public function users(Request $request)
    {
        // Soft-deleted users are excluded by the model's default scope, same as any
        // other query — so deleted accounts now stay visible in the table (and every
        // other status filter has to explicitly exclude them, since e.g. a deleted
        // user's is_active flag doesn't change when they're soft-deleted).
        $query = User::withTrashed();

        if ($request->role && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->status && $request->status !== 'all') {
            match ($request->status) {
                'active' => $query->whereNull('deleted_at')->where('is_active', true)->where('is_suspended', false),
                'inactive' => $query->whereNull('deleted_at')->where('is_active', false),
                'suspended' => $query->whereNull('deleted_at')->where('is_suspended', true),
                'deleted' => $query->whereNotNull('deleted_at'),
                default => null,
            };
        }

        if ($request->verified && $request->verified !== 'all') {
            match ($request->verified) {
                'verified' => $query->whereNotNull('email_verified_at'),
                'unverified' => $query->whereNull('email_verified_at'),
                default => null,
            };
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%");

                // Lets a search box query like "#42" or a bare "42" find the
                // user by ID too, alongside the usual name/email match.
                if (is_numeric(ltrim($request->search, '#'))) {
                    $q->orWhere('id', ltrim($request->search, '#'));
                }
            });
        }

        // Whitelisted so `sort` can't be used to order by an arbitrary column.
        $sortable = ['id' => 'id', 'name' => 'name', 'email' => 'email', 'role' => 'role', 'joined' => 'created_at', 'verified' => 'email_verified_at'];
        $sort = $sortable[$request->sort] ?? 'name';
        $direction = $request->direction === 'desc' ? 'desc' : 'asc';
        $users = $query->orderBy($sort, $direction)->paginate($this->perPage($request, 10))->withQueryString();

        // Real month-over-month trends. Total is purely additive (created_at). Active/inactive
        // and admin role now have their own change timestamps (active_status_changed_at,
        // role_changed_at — see the 2026_07_18 migration), suspensions already had real
        // timestamps via suspension_logs (created_at/lifted_at), and verification already had
        // email_verified_at. Unverified has no "became unverified" event to track (verification
        // isn't revocable here), so it stays a plain composition ratio rather than a fabricated
        // trend.
        $startOfMonth = now()->startOfMonth();
        $newUsersThisMonth = User::where('created_at', '>=', $startOfMonth)->count();
        $usersBeforeThisMonth = User::where('created_at', '<', $startOfMonth)->count();
        $userGrowthRate = $usersBeforeThisMonth > 0
            ? round(($newUsersThisMonth - $usersBeforeThisMonth) / $usersBeforeThisMonth * 100, 1)
            : ($newUsersThisMonth > 0 ? 100.0 : 0.0);

        $activeTrend = $this->monthOverMonthChange(User::where('is_active', true)->where('is_suspended', false), 'active_status_changed_at');
        $inactiveTrend = $this->monthOverMonthChange(User::where('is_active', false), 'active_status_changed_at');
        $adminsTrend = $this->monthOverMonthChange(User::whereIn('role', ['admin', 'superadmin']), 'role_changed_at');
        $superAdminsTrend = $this->monthOverMonthChange(User::where('role', 'superadmin'), 'role_changed_at');
        $suspendedTrend = $this->monthOverMonthChange(SuspensionLog::query(), 'created_at');
        $verifiedTrend = $this->monthOverMonthChange(User::whereNotNull('email_verified_at'), 'email_verified_at');

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->where('is_suspended', false)->count();
        $inactiveUsers = User::where('is_active', false)->count();
        $suspendedUsers = User::where('is_suspended', true)->count();
        $adminUsers = User::whereIn('role', ['admin', 'superadmin'])->count();
        $superAdminUsers = User::where('role', 'superadmin')->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $unverifiedUsers = User::whereNull('email_verified_at')->count();
        $deletedUsers = User::onlyTrashed()->count();
        $ratio = fn (int $part) => $totalUsers > 0 ? round($part / $totalUsers * 100, 1) : 0;

        $stats = [
            'total' => $totalUsers,
            'active' => $activeUsers,
            'activeRatio' => $ratio($activeUsers),
            'activeTrend' => $activeTrend['change'],
            'inactive' => $inactiveUsers,
            'inactiveRatio' => $ratio($inactiveUsers),
            'inactiveTrend' => $inactiveTrend['change'],
            'suspended' => $suspendedUsers,
            'suspendedRatio' => $ratio($suspendedUsers),
            'suspendedTrend' => $suspendedTrend['change'],
            'admins' => $adminUsers,
            'adminsRatio' => $ratio($adminUsers),
            'adminsTrend' => $adminsTrend['change'],
            'superadmins' => $superAdminUsers,
            'superadminsRatio' => $ratio($superAdminUsers),
            'superadminsTrend' => $superAdminsTrend['change'],
            'verified' => $verifiedUsers,
            'verifiedRatio' => $ratio($verifiedUsers),
            'verifiedTrend' => $verifiedTrend['change'],
            'unverified' => $unverifiedUsers,
            'unverifiedRatio' => $ratio($unverifiedUsers),
            'deleted' => $deletedUsers,
            'deletedRatio' => $ratio($deletedUsers),
            'newUsersThisMonth' => $newUsersThisMonth,
            'userGrowthRate' => $userGrowthRate,
        ];

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'stats' => $stats,
            // Explicit keys with defaults, not $request->only([...]) — when no query params are
            // present, only() returns an empty PHP array, which json_encode serializes as a JSON
            // array ([]) rather than an object ({}), since PHP can't tell the two apart when empty.
            // On the frontend that made `filters.sort` resolve to the inherited Array.prototype.sort
            // *function* instead of undefined, which useState() treats as a lazy initializer and
            // calls with no valid `this` — throwing "Cannot convert undefined or null to object".
            // Always including every key guarantees a non-empty associative array, which always
            // encodes as a real JSON object.
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', 'all'),
                'status' => $request->input('status', 'all'),
                'verified' => $request->input('verified', 'all'),
                'per_page' => (string) $this->perPage($request, 10),
                'sort' => $request->input('sort', 'name'),
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Raw DB::table() rows come back with created_at as a bare "Y-m-d H:i:s" string with no
     * timezone marker. Same fix as DashboardController::toIsoUtc() — kept as a separate copy
     * here rather than a shared trait since these two controllers don't otherwise share state,
     * and the fix is a single line.
     */
    private function toIsoUtc(string $rawDateTime): string
    {
        return \Carbon\Carbon::parse($rawDateTime, 'UTC')->toJSON();
    }

    /** Mirrors DashboardController::EXCLUDED_ACCOUNT_ACTIONS for the same reason: preference-update
     * noise isn't meaningful activity, and login/logout gets its own dedicated view. */
    private const EXCLUDED_ACCOUNT_ACTIONS = [
        'email_preferences_updated',
        'notification_preferences_updated',
        'logged_in',
        'logged_out',
    ];

    /**
     * Admin-side view of one user's Activity Logs (their account activity plus every project
     * they're in), reusing the exact same ActivityLogs page a user sees for themselves. Access
     * is read-only and exists for support and moderation purposes: investigating a suspicious
     * account, confirming what actually happened during a suspension appeal, or troubleshooting
     * a "my task/comment disappeared" ticket.
     *
     * This does NOT notify the user being viewed. Every other admin action here (suspend, reset
     * password, role change) changes something about the account, so it gets logged AND the user
     * finds out (email, forced logout, etc). Reading a log is not a state change, and proactively
     * telling someone "an admin looked at your login history" on every read would either be
     * pure noise for routine support lookups, or actively counterproductive during an abuse/
     * security investigation where tipping off the account isn't in anyone's interest. Full
     * accountability is instead kept the same way every other admin action already is: an
     * AdminLog entry below, visible to admins on /admin/logs.
     */
    public function userLogs(Request $request, User $user)
    {
        AdminLog::log('user.logs_viewed', "Viewed activity logs for **{$user->name}** (**{$user->email}**)", $user);

        $action = $request->input('action', 'all');
        $projectFilter = $request->input('project', 'all');

        $projectLogs = DB::table('project_activity_logs')
            ->select('id', DB::raw("'project' as source"), 'project_id', 'action', 'details', 'created_at')
            ->where('user_id', $user->id);

        $accountLogs = DB::table('account_activity_logs')
            ->select('id', DB::raw("'account' as source"), DB::raw('NULL as project_id'), 'action', 'details', 'created_at')
            ->where('user_id', $user->id)
            ->whereNotIn('action', self::EXCLUDED_ACCOUNT_ACTIONS);

        if ($action !== 'all') {
            $projectLogs->where('action', $action);
            $accountLogs->where('action', $action);
        }

        if ($projectFilter !== 'all') {
            $projectLogs->where('project_id', $projectFilter);
            $accountLogs->whereRaw('1 = 0');
        }

        $from = $request->input('from');
        $to = $request->input('to');

        if ($from) {
            $projectLogs->whereDate('created_at', '>=', $from);
            $accountLogs->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $projectLogs->whereDate('created_at', '<=', $to);
            $accountLogs->whereDate('created_at', '<=', $to);
        }

        $logs = $projectLogs->unionAll($accountLogs)
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request, 10))
            ->withQueryString();

        $projectIds = collect($logs->items())->pluck('project_id')->filter()->unique()->values();
        $projectNames = Project::whereIn('id', $projectIds)->pluck('name', 'id');

        $logs->getCollection()->transform(fn ($row) => [
            'id' => $row->id,
            'source' => $row->source,
            'action' => $row->action,
            'details' => $row->details ? json_decode($row->details, true) : null,
            'created_at' => $this->toIsoUtc($row->created_at),
            'project' => $row->project_id ? [
                'id' => $row->project_id,
                'name' => $projectNames[$row->project_id] ?? 'Unknown Project',
            ] : null,
        ]);

        return Inertia::render('ActivityLogs', [
            'logs' => $logs,
            'userProjects' => $user->projects()->orderBy('projects.name')->get(['projects.id', 'projects.name'])
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])
                ->values(),
            'filters' => [
                'action' => $action,
                'project' => $projectFilter,
                'from' => $from ?? '',
                'to' => $to ?? '',
                'per_page' => (string) $this->perPage($request, 10),
            ],
            'backHref' => route('admin.users'),
            'backLabel' => 'Back to Users',
            'viewingUser' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ]);
    }

    /**
     * Admin-side view of one user's Login History (logged_in/logged_out only), reached from the
     * Activity Logs view above the same way the self-service pages link to each other. Same
     * read-only, no-notification logic as userLogs() above.
     */
    public function userLoginHistory(Request $request, User $user)
    {
        AdminLog::log('user.login_history_viewed', "Viewed login history for **{$user->name}** (**{$user->email}**)", $user);

        $action = $request->input('action', 'all');

        $query = DB::table('account_activity_logs')
            ->where('user_id', $user->id)
            ->whereIn('action', ['logged_in', 'logged_out']);

        if ($action !== 'all') {
            $query->where('action', $action);
        }

        $from = $request->input('from');
        $to = $request->input('to');

        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        $logs = $query->orderByDesc('created_at')
            ->paginate($this->perPage($request, 10))
            ->withQueryString();

        $logs->getCollection()->transform(fn ($row) => [
            'id' => $row->id,
            'action' => $row->action,
            'details' => $row->details ? json_decode($row->details, true) : null,
            'created_at' => $this->toIsoUtc($row->created_at),
        ]);

        return Inertia::render('Admin/UserLoginHistory', [
            'logs' => $logs,
            'filters' => [
                'action' => $action,
                'from' => $from ?? '',
                'to' => $to ?? '',
                'per_page' => (string) $this->perPage($request, 10),
            ],
            'backHref' => route('admin.users.logs', $user->id),
            'backLabel' => "Back to {$user->name}'s Activity Logs",
            'viewingUser' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ]);
    }

    public function projects(Request $request)
    {
        // 'members' count needs withTrashed() too, same reasoning as
        // Project::owner() — an owner mid-deletion is still a member of
        // their own project for the length of the grace period.
        $query = Project::with('owner')->withCount(['members' => fn ($q) => $q->withTrashed(), 'tasks']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('id', $request->search)
                ->orWhereHas('owner', function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('email', 'like', "%{$request->search}%");
                });
            });
        }

        // Whitelisted so `sort` can't be used to order by an arbitrary column.
        $sortable = ['name' => 'name', 'joined' => 'created_at', 'members' => 'members_count', 'tasks' => 'tasks_count'];
        $sort = $sortable[$request->sort] ?? 'name';
        $direction = $request->direction === 'desc' ? 'desc' : 'asc';
        $projects = $query->orderBy($sort, $direction)->paginate($this->perPage($request, 10))->withQueryString();

        return Inertia::render('Admin/Projects', [
            'projects' => $projects,
            // See users() above for why this must be explicit keys, not $request->only([...]) —
            // an empty array serializes as JSON [] instead of {}, which broke `filters.sort` on
            // the frontend (it resolved to the inherited Array.prototype.sort function).
            'filters' => [
                'search' => $request->input('search', ''),
                'per_page' => (string) $this->perPage($request, 10),
                'sort' => $request->input('sort', 'name'),
                'direction' => $direction,
            ],
        ]);
    }

public function suspend(Request $request, User $user)
{
    if ($user->id === auth()->id()) {
        return back()->withErrors(['error' => "You can't suspend your own account."]);
    }

    $request->validate([
        'duration' => 'required|string',
        'custom_date' => 'nullable|date|after:now',
        'reason' => 'required|string|max:2000',
    ]);

    $suspendedUntil = match ($request->duration) {
        'permanent' => null,
        'custom' => \Carbon\Carbon::parse($request->custom_date),
        default => now()->addDays((int) $request->duration),
    };

    $user->update([
        'is_suspended' => true,
        'suspended_until' => $suspendedUntil,
        'suspension_reason' => $request->reason,
        'suspended_by' => auth()->id(),
    ]);

    // New: log every suspension for the audit trail
    SuspensionLog::create([
        'user_id' => $user->id,
        'suspended_by' => auth()->id(),
        'reason' => $request->reason,
        'suspended_until' => $suspendedUntil,
    ]);

    AdminLog::log('user.suspended', "Suspended **{$user->name}** (**{$user->email}**)", $user, $request->reason);

    event(new UserSuspended($user));

    NotificationMailer::send(
        $user,
        'account.suspended',
        'Your account has been suspended',
        [
            $suspendedUntil
                ? "Your account has been suspended until {$suspendedUntil->format('M j, Y g:i A')}."
                : 'Your account has been suspended indefinitely.',
            "If you believe this was a mistake, you can submit an appeal using the button below.",
        ],
        url(route('appeal.page', [], false)),
        'Submit an Appeal',
        highlight: $request->reason ? [
            'label' => 'Reason',
            'content' => \App\Support\NoteFormatter::toHtml($request->reason),
            'html' => true,
        ] : null,
    );

    return back()->with('success', 'User suspended.');
}

    public function liftSuspension(Request $request, User $user)
    {
        $request->validate([
            'reason' => 'required|string|max:2000',
            'appeal_id' => 'nullable|exists:suspension_appeals,id',
        ]);

        DB::transaction(function () use ($request, $user) {
            $user->update([
                'is_suspended' => false,
                'suspended_until' => null,
                'suspension_reason' => null,
                'suspended_by' => null,
            ]);

            SuspensionLog::where('user_id', $user->id)->whereNull('lifted_at')->latest()->first()?->update([
                'lifted_at' => now(),
                'lifted_by' => auth()->id(),
            ]);

            AdminLog::log('user.suspension_lifted', "Lifted suspension for **{$user->name}** (**{$user->email}**)", $user, $request->reason);

            // Resolve any pending appeal(s) tied to this account, same as reviewAppeal()
            // does when an appeal is approved from the Appeals page — so lifting a
            // suspension from Manage Users doesn't leave an appeal the user submitted
            // stuck showing "Pending" forever. $request->appeal_id is honored first for
            // callers that already know the specific appeal; otherwise every appeal
            // still pending for this user is resolved, since lifting the suspension
            // they were appealing effectively decides it regardless of which admin
            // screen was used.
            $pendingAppeals = $request->appeal_id
                ? SuspensionAppeal::where('id', $request->appeal_id)
                    ->where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->get()
                : SuspensionAppeal::where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->get();

            foreach ($pendingAppeals as $appeal) {
                $appeal->update([
                    'status' => 'reviewed',
                    'outcome' => 'approved',
                    'admin_reason' => $request->reason,
                ]);
                AdminLog::log('appeal.reviewed', "Reviewed **{$user->name}**'s suspension appeal", $appeal, $request->reason);
            }
        });

        \App\Support\AdminAlerts::broadcastRefresh();

        NotificationMailer::send(
            $user,
            'account.suspension_lifted',
            'Your suspension has been lifted',
            [
                "Good news, your Synkro account suspension has been lifted. You can log in again right away.",
            ],
            url(route('login', [], false)),
            'Log In',
            highlight: $request->reason ? [
                'label' => 'Note from our team',
                'content' => \App\Support\NoteFormatter::toHtml($request->reason),
                'html' => true,
            ] : null,
        );

        return back()->with('success', 'Suspension lifted.');
    }

    public function suspensionLogs(Request $request)
    {
        $query = SuspensionLog::with(['user', 'suspendedBy', 'liftedBy']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('user', function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
                })
                ->orWhereHas('suspendedBy', function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%");
                })
                ->orWhere('reason', 'like', "%{$request->search}%");
            });
        }

        if ($request->status && $request->status !== 'all') {
            match ($request->status) {
                'active' => $query->whereNull('lifted_at'),
                'lifted' => $query->whereNotNull('lifted_at'),
                default => null,
            };
        }

        // Date filters are inclusive on both ends and compare by day only (no time-of-day precision).
        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Whitelisted so `sort` can't be used to order by an arbitrary column.
        $sortable = ['created_at' => 'created_at', 'suspended_until' => 'suspended_until'];
        $sort = $sortable[$request->sort] ?? 'created_at';
        $direction = $request->direction === 'asc' ? 'asc' : 'desc';
        $logs = $query->orderBy($sort, $direction)->paginate($this->perPage($request, 10))->withQueryString();

        return Inertia::render('Admin/SuspensionLogs', [
            'logs' => $logs,
            // See users() above for why this must be explicit keys, not $request->only([...]).
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'from' => $request->input('from', ''),
                'to' => $request->input('to', ''),
                'per_page' => (string) $this->perPage($request, 10),
                'sort' => $request->input('sort', 'created_at'),
                'direction' => $direction,
            ],
        ]);
    }

    /**
     * Administration Logs page (general audit trail).
     * Distinct from suspensionLogs() above (user-suspension-specific) and
     * projectLogs() below (per-project member activity) — this one covers
     * every AdminLog::log() call across the app (see AdminLog::actionCatalog()
     * for the full list of tracked action types).
     */
    public function logs(Request $request)
    {
        $query = AdminLog::with('admin');

        // Free-text search matches either the log description or the admin's name.
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('description', 'like', "%{$request->search}%")
                    ->orWhere('reason', 'like', "%{$request->search}%")
                    ->orWhereHas('admin', function ($q2) use ($request) {
                        $q2->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->action && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        // 'deleted' is a synthetic value (no admin_id in the DB is ever literally
        // "deleted") standing in for admin_id IS NULL, i.e. the admin who performed
        // the action no longer has an account. Real admins are filtered by id.
        if ($request->admin && $request->admin !== 'all') {
            if ($request->admin === 'deleted') {
                $query->whereNull('admin_id');
            } else {
                $query->where('admin_id', $request->admin);
            }
        }

        // Date filters are inclusive on both ends and compare by day only (no time-of-day precision).
        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->latest()->paginate($this->perPage($request, 10))->withQueryString();

        // Distinct admins who have ever produced a log entry, for the "who did this"
        // filter — not all users, since most users are never admins/never act.
        $admins = User::whereIn('id', AdminLog::query()->whereNotNull('admin_id')->distinct()->pluck('admin_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'avatar_path']);
        $hasDeletedAdminLogs = AdminLog::whereNull('admin_id')->exists();

        return Inertia::render('Admin/Logs', [
            'logs' => $logs,
            'actionCatalog' => AdminLog::actionCatalog(),
            'admins' => $admins,
            'hasDeletedAdminLogs' => $hasDeletedAdminLogs,
            // Explicit keys, not $request->only([...]) — see users() above. No key here collides
            // with an Array.prototype method today, but this avoids the landmine entirely.
            'filters' => [
                'search' => $request->input('search', ''),
                'action' => $request->input('action', 'all'),
                'admin' => $request->input('admin', 'all'),
                'from' => $request->input('from', ''),
                'to' => $request->input('to', ''),
                'per_page' => (string) $this->perPage($request, 10),
            ],
        ]);
    }

    public function toggleRole(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't change your own role."]);
        }
        if ($user->isSuperAdmin()) {
            return back()->withErrors(['error' => "Superadmin status isn't managed from here."]);
        }
        $newRole = $user->role === 'admin' ? 'user' : 'admin';
        $user->update(['role' => $newRole, 'role_changed_at' => now()]);
        AdminLog::log('user.role_changed', "Changed **{$user->name}**'s role to **{$newRole}**", $user);

        if ($newRole === 'admin') {
            if (NotificationPreferences::wantsType($user, 'admin_status_changed')) {
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'type' => 'admin_status_changed',
                    'causer_id' => auth()->id(),
                    'message' => "Promoted to admin\nYou were granted **administrator** access on Synkro.",
                    'url' => route('admin.dashboard', [], false),
                ]);

                try {
                    broadcast(new AdminStatusChanged($user->id, $newRole, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $user,
                'account.admin_granted',
                'You were granted administrator access',
                ['You were granted administrator access on Synkro.'],
                url(route('admin.dashboard', [], false)),
                'Go to Admin Dashboard'
            );
        } else {
            if (NotificationPreferences::wantsType($user, 'admin_status_changed')) {
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'type' => 'admin_status_changed',
                    'causer_id' => auth()->id(),
                    'message' => "Removed from admin\nYour **administrator** access on Synkro was removed.",
                    'url' => route('dashboard', [], false),
                ]);

                try {
                    broadcast(new AdminStatusChanged($user->id, $newRole, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $user,
                'account.admin_revoked',
                'Your administrator access was removed',
                ['Your **administrator** access on Synkro was removed.'],
                url(route('dashboard', [], false)),
                'Go to Dashboard'
            );
        }

        return back()->with('success', 'Role updated.');
    }

    /**
     * Superadmin-only: promote an existing admin to superadmin, or demote a superadmin
     * back down to a regular admin. Unlike toggleRole() above (plain user <-> admin),
     * this never touches a 'user' role directly — someone has to already be an admin
     * before they can be trusted with superadmin.
     */
    public function toggleSuperAdmin(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't change your own role."]);
        }
        if ($user->role === 'user') {
            return back()->withErrors(['error' => 'Only admins can be promoted to superadmin.']);
        }

        $newRole = $user->isSuperAdmin() ? 'admin' : 'superadmin';
        $user->update(['role' => $newRole, 'role_changed_at' => now()]);
        AdminLog::log('user.role_changed', "Changed **{$user->name}**'s role to **{$newRole}**", $user);

        $message = $newRole === 'superadmin'
            ? "Promoted to superadmin\nYou were granted **superadmin** access on Synkro."
            : "Demoted to admin\nYour **superadmin** access on Synkro was removed. You're still an **admin**.";

        if (NotificationPreferences::wantsType($user, 'admin_status_changed')) {
            $notification = UserNotification::create([
                'user_id' => $user->id,
                'type' => 'admin_status_changed',
                'causer_id' => auth()->id(),
                'message' => $message,
                'url' => route('admin.dashboard', [], false),
            ]);

            try {
                broadcast(new AdminStatusChanged($user->id, $newRole, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        NotificationMailer::send(
            $user,
            $newRole === 'superadmin' ? 'account.admin_granted' : 'account.admin_revoked',
            $newRole === 'superadmin' ? 'You were granted superadmin access' : 'Your superadmin access was removed',
            [
                $newRole === 'superadmin'
                    ? 'You were granted superadmin access on Synkro.'
                    : "Your superadmin access on Synkro was removed. You're still an admin.",
            ],
            url(route('admin.dashboard', [], false)),
            'Go to Admin Dashboard'
        );

        return back()->with('success', 'Role updated.');
    }

    /**
     * Superadmin-only: edit a user's name and/or email. Mirrors the security
     * notifications AccountController::update() sends for a self-service email
     * change — the OLD address always gets a direct alert regardless of email
     * preference (that's the account that might be compromised), while the new
     * address and in-app bell go through the normal preference-gated channel —
     * just phrased for an admin-initiated change instead of a self-service one.
     */
    public function updateUser(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => 'Use your own account settings to edit your info.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
        ]);

        $oldEmail = $user->email;
        $newEmail = $validated['email'];

        $user->fill($validated);
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        if (! $user->wasChanged()) {
            return back()->with('success', 'No changes made.');
        }

        $summary = array_filter([
            $user->wasChanged('name') ? "name to \"{$user->name}\"" : null,
            $user->wasChanged('email') ? "email to {$newEmail}" : null,
        ]);
        AdminLog::log('user.info_updated', "Updated ".implode(' and ', $summary)." for **{$user->name}** (**{$user->email}**)", $user);

        if ($user->wasChanged('email')) {
            // Security alert to the OLD address, always sent (same as a self-service change).
            try {
                Mail::to($oldEmail)->queue(new SynkroNotificationMail(
                    $user->name,
                    'Your email address was changed',
                    [
                        "Your Synkro account email was changed by an administrator, from **{$oldEmail}** to **{$newEmail}**.",
                        "If you weren't expecting this, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately.',
                    ]
                ));
            } catch (\Throwable $e) {
                report($e);
            }

            NotificationMailer::send(
                $user,
                'account.email_changed',
                'Your email address was updated',
                ["Your Synkro account email is now **{$newEmail}**."]
            );

            if (NotificationPreferences::wantsType($user, 'email_changed')) {
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'type' => 'email_changed',
                    'causer_id' => auth()->id(),
                    'message' => "Email address changed\nYour account email is now **{$newEmail}**.",
                    'url' => route('account.edit', [], false),
                ]);

                try {
                    broadcast(new EmailChanged($user->id, $newEmail, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return back()->with('success', 'User info updated.');
    }

    /**
     * Shared by destroy() and destroyBulk(): unwinds project memberships (same path
     * self-service deletion uses) or purges the account outright, logs the action, and
     * notifies the deleted user. Uses its own always-sent 'account.deleted_by_admin'
     * preference key rather than the self-service 'account.deleted' key, since this is
     * security-relevant and shouldn't be suppressible by a preference the user set for
     * their own actions.
     *
     * $mode is 'graceful' (default: soft-delete with the usual restore window) or
     * 'permanent' (immediate, no grace period, cannot be restored).
     */
    private function performAdminDelete(User $user, string $mode = 'graceful'): void
    {
        $name = $user->name;

        if ($mode === 'permanent') {
            AdminLog::log('user.deleted_permanent', "Permanently deleted account for **{$name}** (**{$user->email}**)", $user);

            NotificationMailer::send(
                $user,
                'account.deleted_by_admin',
                'Your account has been permanently deleted',
                [
                    'Your Synkro account was permanently deleted by an administrator.',
                    'This was immediate — there is no grace period, and the account cannot be restored.',
                    "If you believe this was done in error, please [contact support](" . url(route('feedback.page', [], false)) . ') as soon as possible.',
                ]
            );

            try {
                event(new \App\Events\AccountDeleted($user->id));
            } catch (\Throwable $e) {
                report($e);
            }

            // Nothing has been unwound yet for this account, so release every task
            // assigned to it (not just pending_resolution ones) in a single pass.
            AccountDeletion::purgeNow($user, onlyPendingTasks: false);

            return;
        }

        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);
        $graceEndsAt = AccountDeletion::unwindProjectsAndDelete($user);

        AdminLog::log('user.deleted', "Deleted account for **{$name}** (**{$user->email}**)", $user);

        NotificationMailer::send(
            $user,
            'account.deleted_by_admin',
            'Your account has been deleted',
            [
                'Your Synkro account was deleted by an administrator.',
                "It will be kept for {$graceDays} more day(s) (until the end of " . $graceEndsAt->format('M j, Y') . ') in case this was a mistake — log back in with your usual email and password before then to restore it.',
                "If you believe this was done in error, please [contact support](" . url(route('feedback.page', [], false)) . ').',
            ]
        );

        try {
            event(new \App\Events\AccountDeleted($user->id));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Superadmin-only: emails a fresh step-up confirmation code to the current
     * admin's own address. Required before an irreversible action is allowed
     * to proceed — currently just permanently deleting user accounts, see
     * destroy()/destroyBulk() below, which verify it via
     * User::verifyAdminConfirmationCode().
     */
    public function sendConfirmationCode(Request $request)
    {
        $validated = $request->validate([
            'purpose' => ['required', 'string', Rule::in(['users.delete_permanent'])],
        ]);

        $request->user()->sendAdminConfirmationCodeNotification($validated['purpose']);

        return back()->with('success', 'A confirmation code has been sent to your email.');
    }

    /** Superadmin-only: delete a single user account, either gracefully or permanently. */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't delete your own account this way. Use your account settings."]);
        }
        if ($user->isSuperAdmin()) {
            return back()->withErrors(['error' => "Superadmin accounts can't be deleted from here."]);
        }
        if ($user->trashed()) {
            return back()->withErrors(['error' => 'That account is already deleted.']);
        }

        $validated = $request->validate([
            'mode' => ['sometimes', 'string', 'in:graceful,permanent'],
            'confirmation_code' => ['required_if:mode,permanent', 'string'],
        ]);
        $mode = $validated['mode'] ?? 'graceful';

        if ($mode === 'permanent') {
            $error = $request->user()->verifyAdminConfirmationCode('users.delete_permanent', $validated['confirmation_code']);
            if ($error) {
                return back()->withErrors(['confirmation_code' => $error]);
            }
        }

        $name = $user->name;
        $this->performAdminDelete($user, $mode);

        $message = $mode === 'permanent'
            ? "{$name}'s account was permanently deleted."
            : "{$name}'s account was deleted.";

        return back()->with('success', $message);
    }

    /**
     * Superadmin-only: delete several user accounts at once, either gracefully or
     * permanently. Skips (rather than fails) any target that can't be deleted this
     * way — your own account, a superadmin, or one already deleted — so one bad id in
     * the selection doesn't block the rest, and reports how many actually went through.
     */
    public function destroyBulk(Request $request)
    {
        $validated = $request->validate([
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'mode' => ['sometimes', 'string', 'in:graceful,permanent'],
            'confirmation_code' => ['required_if:mode,permanent', 'string'],
        ]);
        $mode = $validated['mode'] ?? 'graceful';

        if ($mode === 'permanent') {
            $error = $request->user()->verifyAdminConfirmationCode('users.delete_permanent', $validated['confirmation_code']);
            if ($error) {
                return back()->withErrors(['confirmation_code' => $error]);
            }
        }

        $deleted = 0;
        $skipped = 0;

        foreach (User::withTrashed()->whereIn('id', $validated['user_ids'])->get() as $user) {
            if ($user->id === auth()->id() || $user->isSuperAdmin() || $user->trashed()) {
                $skipped++;
                continue;
            }

            $this->performAdminDelete($user, $mode);
            $deleted++;
        }

        $verb = $mode === 'permanent' ? 'permanently deleted' : 'deleted';
        $message = $deleted === 1 ? "1 account {$verb}." : "{$deleted} accounts {$verb}.";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped (your own account or a superadmin can't be deleted this way).";
        }

        return back()->with('success', $message);
    }

    public function resetPassword(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't reset your own password this way. Use your profile settings."]);
        }

        $newPassword = Str::random(12);

        $user->update([
            'password' => Hash::make($newPassword),
            'must_change_password' => true,
            'temp_password_expires_at' => now()->addHours(24),
        ]);

        AdminLog::log('user.password_reset', "Reset password for **{$user->name}** (**{$user->email}**)", $user);

        // If the user has an active session open right now, this kicks them out of it
        // immediately rather than leaving a stale session running on the old password.
        // Harmless to broadcast even if they're not currently logged in: private channel
        // user.{id} only has a listener while an authenticated session for that user exists.
        event(new PasswordResetByAdmin($user));

        NotificationMailer::send(
            $user,
            'account.temp_password',
            'Your password has been reset',
            [
                'An administrator has reset your Synkro password.',
                'This password expires in 24 hours. Please log in and set a new password as soon as possible.',
            ],
            url(route('login', [], false)),
            'Log In Now',
            [
                'label' => 'Temporary Password',
                'content' => $newPassword,
                'mono' => true,
            ]
        );

        return back()->with('success', 'Password reset and emailed to the user.');
    }

    public function appeals(Request $request)
    {
        $query = SuspensionAppeal::with(['user', 'responses.admin']);

        if ($request->search) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $appeals = $query->latest()->get();

        return Inertia::render('Admin/Appeals', [
            'appeals' => $appeals,
            'filters' => ['search' => $request->input('search', '')],
        ]);
    }

    /**
     * Superadmin/admin: leave a note on a pending appeal without deciding it yet —
     * e.g. asking a follow-up question, or acknowledging it's being looked into.
     * Unlike reviewAppeal() this doesn't touch status/outcome, so the appeal stays
     * pending; it exists mainly so "a supporter has responded" becomes something
     * CloseInactiveAppeals can actually detect (see that command's doc comment).
     */
    public function respondAppeal(Request $request, SuspensionAppeal $appeal)
    {
        if ($appeal->status !== 'pending') {
            return back()->withErrors(['error' => "This appeal has already been decided — there's nothing to add a note to."]);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $appeal->responses()->create([
            'admin_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        AdminLog::log(
            'appeal.responded',
            "Left a note on **{$appeal->user?->name}**'s suspension appeal",
            $appeal,
            $validated['message']
        );

        if ($appeal->user) {
            NotificationMailer::send(
                $appeal->user,
                'account.appeal_responded',
                'An update on your suspension appeal',
                ['A member of our support team left a note on your suspension appeal:'],
                url(route('login', [], false)),
                'View Details',
                highlight: [
                    'label' => 'Note from support',
                    'content' => \App\Support\NoteFormatter::toHtml($validated['message']),
                    'html' => true,
                ],
            );

            $notification = UserNotification::create([
                'user_id' => $appeal->user->id,
                'type' => 'appeal_responded',
                'causer_id' => auth()->id(),
                'message' => "Update on your appeal\nA member of our support team left a note on your suspension appeal.",
                'url' => route('login', [], false),
            ]);

            try {
                broadcast(new \App\Events\AppealResponded($appeal->user->id, $appeal->id, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Note added.');
    }

    public function reviewAppeal(Request $request, SuspensionAppeal $appeal)
    {
        if ($appeal->status !== 'pending') {
            return back()->withErrors(['error' => 'This appeal has already been decided and can\'t be changed.']);
        }

        $request->validate([
            'outcome' => 'required|in:approved,rejected',
            'reason' => 'required|string|max:2000',
        ]);

        // Accepting an appeal and lifting the underlying suspension are done as one
        // atomic decision here, so the two can never drift apart (e.g. an appeal
        // marked "approved" while the user is still locked out).
        DB::transaction(function () use ($request, $appeal) {
            $appeal->update([
                'status' => 'reviewed',
                'outcome' => $request->outcome,
                'admin_reason' => $request->reason,
            ]);

            AdminLog::log(
                $request->outcome === 'approved' ? 'appeal.reviewed' : 'appeal.dismissed',
                ($request->outcome === 'approved' ? 'Approved' : 'Rejected') . " **{$appeal->user?->name}**'s suspension appeal",
                $appeal,
                $request->reason
            );

            if ($request->outcome === 'approved' && $appeal->user && $appeal->user->is_suspended) {
                $appeal->user->update([
                    'is_suspended' => false,
                    'suspended_until' => null,
                    'suspension_reason' => null,
                    'suspended_by' => null,
                ]);

                SuspensionLog::where('user_id', $appeal->user_id)->whereNull('lifted_at')->latest()->first()?->update([
                    'lifted_at' => now(),
                    'lifted_by' => auth()->id(),
                ]);

                AdminLog::log('user.suspension_lifted', "Lifted suspension for **{$appeal->user->name}** (**{$appeal->user->email}**)", $appeal->user, $request->reason);
            }

            // A user can end up with more than one pending appeal — e.g. an earlier
            // suspension auto-expired (or was lifted some other way) without that
            // appeal ever going through this review flow. Deciding this appeal
            // effectively decides those too, so resolve them here instead of leaving
            // them stuck showing "Pending" indefinitely once this one is reviewed.
            SuspensionAppeal::where('user_id', $appeal->user_id)
                ->where('status', 'pending')
                ->where('id', '!=', $appeal->id)
                ->update([
                    'status' => 'reviewed',
                    'outcome' => $request->outcome,
                    'admin_reason' => 'Resolved automatically: a newer appeal for this account was reviewed.',
                    'auto_resolved' => true,
                ]);
        });

        \App\Support\AdminAlerts::broadcastRefresh();

        if ($appeal->user) {
            // Mirrors the ticket-reply email's highlight box (see FeedbackAdminController::respond)
            // instead of burying the admin's reason in a plain text line, so the decision reads
            // clearly rather than blending into the surrounding paragraph.
            NotificationMailer::send(
                $appeal->user,
                'account.appeal_reviewed',
                'Your appeal has been reviewed',
                [
                    $request->outcome === 'approved'
                        ? 'Your appeal was reviewed and accepted. Your suspension has been lifted and you can log in again right away.'
                        : 'Your appeal was reviewed and rejected.',
                ],
                url(route('login', [], false)),
                'Log In',
                highlight: $request->reason ? [
                    'label' => $request->outcome === 'approved' ? 'Reason for approval' : 'Reason for rejection',
                    'content' => \App\Support\NoteFormatter::toHtml($request->reason),
                    'html' => true,
                ] : null,
            );
        }

        return back()->with('success', 'Appeal updated.');
    }
    public function destroyProject(Project $project)
    {
        abort(403, 'Platform admins cannot delete projects directly.');
    }
    public function projectLogs(Project $project)
    {
        $logs = $project->activityLogs()->with('user')->latest()->get();

        return Inertia::render('Projects/Logs', [
            'project' => $project,
            'logs' => $logs,
            'backHref' => route('admin.projects'),
            'backLabel' => 'Back to Projects',
        ]);
    }
}
