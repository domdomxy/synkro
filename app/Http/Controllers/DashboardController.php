<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private function buckets(string $range): array
    {
        return match ($range) {
            'today' => array_map(fn ($h) => [
                'label' => now()->subHours(23 - $h)->format('ga'),
                'start' => now()->subHours(23 - $h)->startOfHour(),
                'end' => now()->subHours(23 - $h)->endOfHour(),
            ], range(0, 23)),
            'month' => array_map(fn ($d) => [
                'label' => (string) ($d + 1),
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
        }, $this->buckets($range));

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
            'stats' => [
                'projectsCount' => $user->projects()->count(),
                'activeTasksCount' => (clone $myTasksQuery)->whereNotIn('status', ['done'])->count(),
                'doneTasksCount' => $tasksByStatus['done'] ?? 0,
                'pendingReview' => $pendingReview,
                'tasksByStatus' => $tasksByStatus,
                'dueSoon' => $dueSoon,
                'chartData' => $chartData,
                'calendarTasks' => $calendarTasks,
                'reminders' => $reminders,
            ],
        ]);
    }
}