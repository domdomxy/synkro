<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SuspensionAppeal;
use App\Models\Task;
use App\Models\User;
use App\Support\NotificationMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\Feedback;
use App\Events\UserSuspended;
use App\Models\SuspensionLog;
use App\Models\AdminLog;
use Illuminate\Support\Facades\DB;

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
        $change = $before > 0
            ? round($thisMonth / $before * 100, 1)
            : ($thisMonth > 0 ? 100.0 : 0.0);

        return ['change' => $change];
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
                }, range(0, $totalDays));
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
                }, range(0, $weeks));
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
            }, range(0, $months));
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

        $chartData = array_map(function ($bucket) {
            return [
                'label' => $bucket['label'],
                'completed' => Task::where('status', 'done')->whereBetween('updated_at', [$bucket['start'], $bucket['end']])->count(),
                'created' => Task::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
                'newUsers' => User::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
                'newProjects' => Project::whereBetween('created_at', [$bucket['start'], $bucket['end']])->count(),
            ];
        }, $this->buckets($range, request('from'), request('to')));

        $activityTotals = [
            'completed' => array_sum(array_column($chartData, 'completed')),
            'created' => array_sum(array_column($chartData, 'created')),
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

        $growthRate = function (string $model) use ($startOfMonth) {
            $before = $model::where('created_at', '<', $startOfMonth)->count();
            $newThisMonth = $model::where('created_at', '>=', $startOfMonth)->count();
            $rate = $before > 0 ? round($newThisMonth / $before * 100, 1) : ($newThisMonth > 0 ? 100.0 : 0.0);
            return [$newThisMonth, $rate];
        };

        [$newUsersThisMonth, $userGrowthRate] = $growthRate(User::class);
        [, $projectGrowthRate] = $growthRate(Project::class);
        [, $taskGrowthRate] = $growthRate(Task::class);

        // We don't track session start/end times, so a true "average session length" isn't
        // computable from the sessions table (it only has last_activity). "Currently online"
        // (active in the last 5 minutes) is the closest honest, real metric available.
        $currentlyOnline = DB::table('sessions')->where('last_activity', '>=', now()->subMinutes(5)->timestamp)->count();

        // A project counts as "completed" once every task in it is done. Projects with zero
        // tasks are excluded since "all zero tasks are done" would be trivially true otherwise.
        $completedProjects = Project::whereHas('tasks')
            ->whereDoesntHave('tasks', fn ($q) => $q->where('status', '!=', 'done'))
            ->count();

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
                'pendingAppeals' => SuspensionAppeal::where('status', 'pending')->count(),
                'pendingFeedbacks' => Feedback::whereIn('status', ['pending', 'reviewing'])->count(),
                'newUsersThisMonth' => $newUsersThisMonth,
                'userGrowthRate' => $userGrowthRate,
                'projectGrowthRate' => $projectGrowthRate,
                'taskGrowthRate' => $taskGrowthRate,
                'currentlyOnline' => $currentlyOnline,
            ],
        ]);
    }

    public function users(Request $request)
    {
        $query = User::query();

        if ($request->role && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->status && $request->status !== 'all') {
            match ($request->status) {
                'active' => $query->where('is_active', true)->where('is_suspended', false),
                'inactive' => $query->where('is_active', false),
                'suspended' => $query->where('is_suspended', true),
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
            });
        }

        // Whitelisted so `sort` can't be used to order by an arbitrary column.
        $sortable = ['name' => 'name', 'email' => 'email', 'role' => 'role', 'joined' => 'created_at', 'verified' => 'email_verified_at'];
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
            ? round($newUsersThisMonth / $usersBeforeThisMonth * 100, 1)
            : ($newUsersThisMonth > 0 ? 100.0 : 0.0);

        $activeTrend = $this->monthOverMonthChange(User::where('is_active', true)->where('is_suspended', false), 'active_status_changed_at');
        $inactiveTrend = $this->monthOverMonthChange(User::where('is_active', false), 'active_status_changed_at');
        $adminsTrend = $this->monthOverMonthChange(User::where('role', 'admin'), 'role_changed_at');
        $suspendedTrend = $this->monthOverMonthChange(SuspensionLog::query(), 'created_at');
        $verifiedTrend = $this->monthOverMonthChange(User::whereNotNull('email_verified_at'), 'email_verified_at');

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->where('is_suspended', false)->count();
        $inactiveUsers = User::where('is_active', false)->count();
        $suspendedUsers = User::where('is_suspended', true)->count();
        $adminUsers = User::where('role', 'admin')->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $unverifiedUsers = User::whereNull('email_verified_at')->count();
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
            'verified' => $verifiedUsers,
            'verifiedRatio' => $ratio($verifiedUsers),
            'verifiedTrend' => $verifiedTrend['change'],
            'unverified' => $unverifiedUsers,
            'unverifiedRatio' => $ratio($unverifiedUsers),
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

    public function projects(Request $request)
    {
        $query = Project::with('owner')->withCount(['members', 'tasks']);

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

    AdminLog::log('user.suspended', "Suspended {$user->name} ({$user->email}): {$request->reason}", $user);

    event(new UserSuspended($user));

    NotificationMailer::send(
        $user,
        'account.suspended',
        'Your account has been suspended',
        array_filter([
            $suspendedUntil
                ? "Your account has been suspended until {$suspendedUntil->format('M j, Y g:i A')}."
                : 'Your account has been suspended indefinitely.',
            "Reason: {$request->reason}",
            "If you believe this was a mistake, you can submit an appeal using the button below.",
        ]),
        url(route('appeal.page', [], false)),
        'Submit an Appeal'
    );

    return back()->with('success', 'User suspended.');
}

    public function liftSuspension(Request $request, User $user)
    {
        $request->validate(['reason' => 'required|string|max:2000']);

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

        AdminLog::log('user.suspension_lifted', "Lifted suspension for {$user->name} ({$user->email})" . ($request->reason ? ": {$request->reason}" : ''), $user);

        NotificationMailer::send(
            $user,
            'account.suspension_lifted',
            'Your suspension has been lifted',
            array_filter([
                "Good news, your Synkro account suspension has been lifted. You can log in again right away.",
                $request->reason ? "Note from our team: {$request->reason}" : null,
            ]),
            url(route('login', [], false)),
            'Log In'
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
                    ->orWhereHas('admin', function ($q2) use ($request) {
                        $q2->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->action && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        // Date filters are inclusive on both ends and compare by day only (no time-of-day precision).
        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->latest()->paginate($this->perPage($request, 10))->withQueryString();

        return Inertia::render('Admin/Logs', [
            'logs' => $logs,
            'actionCatalog' => AdminLog::actionCatalog(),
            // Explicit keys, not $request->only([...]) — see users() above. No key here collides
            // with an Array.prototype method today, but this avoids the landmine entirely.
            'filters' => [
                'search' => $request->input('search', ''),
                'action' => $request->input('action', 'all'),
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
        $newRole = $user->role === 'admin' ? 'user' : 'admin';
        $user->update(['role' => $newRole, 'role_changed_at' => now()]);
        AdminLog::log('user.role_changed', "Changed {$user->name}'s role to {$newRole}", $user);
        return back()->with('success', 'Role updated.');
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

        AdminLog::log('user.password_reset', "Reset password for {$user->name} ({$user->email})", $user);

        NotificationMailer::send(
            $user,
            'account.temp_password',
            'Your password has been reset',
            [
                'An administrator has reset your Synkro password.',
                "Your new temporary password is: {$newPassword}",
                'This password expires in 24 hours. Please log in and set a new password as soon as possible.',
            ],
            url(route('login', [], false)),
            'Log In Now'
        );

        return back()->with('success', 'Password reset and emailed to the user.');
    }

    public function appeals(Request $request)
    {
        $query = SuspensionAppeal::with('user');

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

    public function reviewAppeal(Request $request, SuspensionAppeal $appeal)
    {
        if ($appeal->status !== 'pending') {
            return back()->withErrors(['error' => 'This appeal has already been decided and can\'t be changed.']);
        }

        $request->validate([
            'status' => 'required|in:reviewed,dismissed',
            'reason' => 'required|string|max:2000',
        ]);
        $appeal->update(['status' => $request->status]);

        AdminLog::log(
            $request->status === 'reviewed' ? 'appeal.reviewed' : 'appeal.dismissed',
            ($request->status === 'reviewed' ? 'Reviewed' : 'Dismissed') . " {$appeal->user?->name}'s suspension appeal" . ($request->reason ? ": {$request->reason}" : ''),
            $appeal
        );

        if ($appeal->user) {
            NotificationMailer::send(
                $appeal->user,
                'account.appeal_reviewed',
                'Your appeal has been reviewed',
                array_filter([
                    $request->status === 'reviewed'
                        ? 'Your suspension appeal has been reviewed by our team.'
                        : 'Your suspension appeal has been dismissed.',
                    $request->reason ? "Reason: {$request->reason}" : null,
                ]),
                url(route('login', [], false)),
                'Log In'
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

        return Inertia::render('Admin/ProjectLogs', [
            'project' => $project,
            'logs' => $logs,
        ]);
    }
}
