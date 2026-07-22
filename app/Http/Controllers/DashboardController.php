<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Reminder;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
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

    public function index()
    {
        $user = Auth::user();
        $range = request('range', 'week');
        $myTasksQuery = Task::where('assigned_to', $user->id);
        $range = request('range', 'week');

        $tasksByStatus = (clone $myTasksQuery)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $dueSoon = Task::where('assigned_to', $user->id)
            ->whereNotIn('status', ['done'])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [now(), now()->addDays(7)])
            ->with('project')
            ->orderBy('due_date')
            ->limit(5)
            ->get();

        $reviewerProjectIds = $user->projects()
            ->wherePivotIn('role', ['owner', 'tester'])
            ->pluck('projects.id');
        $pendingReview = Task::whereIn('project_id', $reviewerProjectIds)
            ->where('status', 'submitted')
            ->count();

        $chartData = array_map(function ($bucket) use ($user) {
            return [
                'label' => $bucket['label'],
                'completed' => Task::where('assigned_to', $user->id)
                    ->where('status', 'done')
                    ->whereBetween('updated_at', [$bucket['start'], $bucket['end']])
                    ->count(),
                'created' => Task::where('assigned_to', $user->id)
                    ->whereBetween('created_at', [$bucket['start'], $bucket['end']])
                    ->count(),
                'projects' => $user->projects()
                    ->whereBetween('project_user.created_at', [$bucket['start'], $bucket['end']])
                    ->count(),
            ];
        }, $this->buckets($range, request('from'), request('to')));

        $activityTotals = [
            'completed' => array_sum(array_column($chartData, 'completed')),
            'created' => array_sum(array_column($chartData, 'created')),
            'projects' => array_sum(array_column($chartData, 'projects')),
        ];
        // Calendar: all tasks with due dates in the next 90 days
        $calendarTasks = Task::where('assigned_to', $user->id)
            ->whereNotNull('due_date')
            ->whereNotIn('status', ['done'])
            ->whereBetween('due_date', [now()->startOfDay(), now()->addDays(90)])
            ->with('project')
            ->orderBy('due_date')
            ->get();

        $reminders = Reminder::where('user_id', $user->id)
            ->where('dismissed', false)
            ->orderBy('remind_at')
            ->get();

        return Inertia::render('Dashboard', [
            'range' => $range,
            'customFrom' => request('from'),
            'customTo' => request('to'),
            'stats' => [
                'projectsCount' => $user->projects()->count(),
                'activeTasksCount' => (clone $myTasksQuery)->whereNotIn('status', ['done'])->count(),
                'doneTasksCount' => $tasksByStatus['done'] ?? 0,
                'pendingReview' => $pendingReview,
                'tasksByStatus' => $tasksByStatus,
                'dueSoon' => $dueSoon,
                'chartData' => $chartData,
                'activityTotals' => $activityTotals,
                'calendarTasks' => $calendarTasks,
                'reminders' => $reminders,
            ],
        ]);
    }

    private function perPage(Request $request, int $default): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return max(1, min($perPage, 500));
    }

    /**
     * Actions that never show in the main feed: preference-update noise that
     * isn't meaningful activity, and login/logout events which get their own
     * dedicated Login History view instead (see loginHistory() below).
     */
    private const EXCLUDED_ACCOUNT_ACTIONS = [
        'email_preferences_updated',
        'notification_preferences_updated',
        'logged_in',
        'logged_out',
    ];

    /**
     * Raw DB::table() rows come back with created_at as a bare "Y-m-d H:i:s"
     * string with no timezone marker. Eloquent models auto-cast this to a
     * Carbon instance (in APP_TIMEZONE, which is UTC) and serialize it to
     * JSON with a trailing 'Z'. Skipping that cast here meant the frontend's
     * `new Date(dateString)` parsed the bare string as browser-local time
     * instead of UTC, shifting every timestamp by the local UTC offset (e.g.
     * an action performed seconds ago showed as "1h ago" for a UTC+1 user).
     * Re-parsing as UTC and emitting proper ISO 8601 fixes that everywhere
     * this feed is displayed.
     */
    private function toIsoUtc(string $rawDateTime): string
    {
        return \Carbon\Carbon::parse($rawDateTime, 'UTC')->toJSON();
    }

    /**
     * Personal activity feed: everything this user has done — both their
     * project activity (ProjectActivityLog, across every project they're in)
     * and their account activity (AccountActivityLog: logins, profile edits,
     * password changes, etc). The two live in separate tables, so they're
     * combined here with a SQL union and paginated as one server-side feed.
     */
    public function activity(Request $request)
    {
        $user = Auth::user();
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
            // Account-level actions aren't tied to a project, so a project filter excludes them entirely.
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

        // Only hydrate project names for the rows on this page, not the whole table.
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
        ]);
    }

    /**
     * Login History: a focused view of just this user's logged_in/logged_out
     * events, split out of the main activity feed so signing in and out
     * (routine, high-frequency) doesn't drown out actual project/account
     * activity. Reached via a button on the Activity Logs page.
     */
    public function loginHistory(Request $request)
    {
        $user = Auth::user();
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

        return Inertia::render('LoginHistory', [
            'logs' => $logs,
            'filters' => [
                'action' => $action,
                'from' => $from ?? '',
                'to' => $to ?? '',
                'per_page' => (string) $this->perPage($request, 10),
            ],
        ]);
    }
}
