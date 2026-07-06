<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SuspensionAppeal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Feedback;
use App\Events\UserSuspended;

class AdminController extends Controller
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
                'pendingFeedbacks' => Feedback::whereIn('status', ['pending', 'reviewing'])->count(),
            ];
        }, $this->buckets($range));

        $recentUsers = User::latest()->limit(5)->get();
        $recentProjects = Project::with('owner')->latest()->limit(5)->get();

        return Inertia::render('Admin/Dashboard', [
            'range' => $range,
            'stats' => [
                'users' => User::count(),
                'activeUsers' => User::where('is_active', true)->where('is_suspended', false)->count(),
                'inactiveUsers' => User::where('is_active', false)->count(),
                'suspendedUsers' => User::where('is_suspended', true)->count(),
                'admins' => User::where('role', 'admin')->count(),
                'projects' => Project::count(),
                'tasks' => Task::count(),
                'tasksByStatus' => $tasksByStatus,
                'chartData' => $chartData,
                'recentUsers' => $recentUsers,
                'recentProjects' => $recentProjects,
                'pendingResolution' => Task::where('pending_resolution', true)->count(),
                'pendingAppeals' => SuspensionAppeal::where('status', 'pending')->count(),
            ],
        ]);
    }

    public function users()
    {
        $users = User::withCount('ownedProjects')->orderBy('name')->get();
        return Inertia::render('Admin/Users', ['users' => $users]);
    }

    public function suspend(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't suspend your own account."]);
        }

        $request->validate([
            'duration' => 'required|string',
            'custom_date' => 'nullable|date|after:now',
            'reason' => 'nullable|string|max:2000',
        ]);

        $suspendedUntil = match ($request->duration) {
            'permanent' => null,
            'custom' => $request->custom_date,
            default => now()->addDays((int) $request->duration),
        };

        $user->update([
            'is_suspended' => true,
            'suspended_until' => $suspendedUntil,
            'suspension_reason' => $request->reason,
            'suspended_by' => auth()->id(),
        ]);

        event(new UserSuspended($user));
        
        return back()->with('success', 'User suspended.');
    }

    public function liftSuspension(User $user)
    {
        $user->update([
            'is_suspended' => false,
            'suspended_until' => null,
            'suspension_reason' => null,
            'suspended_by' => null,
        ]);

        return back()->with('success', 'Suspension lifted.');
    }

    public function toggleRole(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->withErrors(['error' => "You can't change your own role."]);
        }
        $user->update(['role' => $user->role === 'admin' ? 'user' : 'admin']);
        return back()->with('success', 'Role updated.');
    }

    public function appeals()
    {
        $appeals = SuspensionAppeal::with('user')->latest()->get();
        return Inertia::render('Admin/Appeals', ['appeals' => $appeals]);
    }

    public function reviewAppeal(Request $request, SuspensionAppeal $appeal)
    {
        $request->validate(['status' => 'required|in:reviewed,dismissed']);
        $appeal->update(['status' => $request->status]);
        return back()->with('success', 'Appeal updated.');
    }

    public function projects()
    {
        $projects = Project::with('owner')->withCount(['members', 'tasks'])->orderBy('name')->get();
        return Inertia::render('Admin/Projects', ['projects' => $projects]);
    }

    public function destroyProject(Project $project)
    {
        abort(403, 'Platform admins cannot delete projects directly.');
    }

}