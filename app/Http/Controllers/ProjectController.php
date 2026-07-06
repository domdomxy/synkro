<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Auth::user()->projects()
            ->with('owner')
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($query) => $query->where('status', 'done'),
            ])
            ->latest()
            ->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create()
    {
        return Inertia::render('Projects/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project = Project::create([
            ...$validated,
            'owner_id' => Auth::id(),
        ]);

        $project->members()->attach(Auth::id(), ['role' => 'owner']);

        ProjectActivityLog::log($project, 'project_created');

        return redirect()->route('projects.show', $project)->with('success', 'Project created.');
    }

    public function show(Project $project)
    {
        $this->authorize('view', $project);

        $project->load(['members', 'tasks.assignee', 'tasks.comments.user', 'tasks.deliverables']);

        $notes = $project->notes()->where('user_id', Auth::id())->latest()->get();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'role' => $project->roleFor(Auth::user()),
            'myNotes' => $notes,
        ]);
    }

    public function edit(Project $project)
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', ['project' => $project]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $changes = [];
        foreach (['name', 'description'] as $field) {
            if ($project->{$field} !== $validated[$field]) {
                $changes[$field] = ['old' => $project->{$field}, 'new' => $validated[$field]];
            }
        }

        $project->update($validated);

        if (! empty($changes)) {
            ProjectActivityLog::log($project, 'project_updated', ['changes' => $changes]);
        }

        return redirect()->route('projects.show', $project)->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        ProjectActivityLog::log($project, 'project_deleted');

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }

    public function transferOwnership(Request $request, Project $project)
    {
        if ($project->owner_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if (! $project->members()->where('user_id', $validated['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'That user is not a member of this project.']);
        }

        $newOwner = \App\Models\User::find($validated['user_id']);

        $project->update(['owner_id' => $validated['user_id']]);
        $project->members()->updateExistingPivot($validated['user_id'], ['role' => 'owner']);
        $project->members()->updateExistingPivot(Auth::id(), ['role' => 'manager']);

        ProjectActivityLog::log($project, 'ownership_transferred', ['target_name' => $newOwner->name]);

        return back()->with('success', 'Ownership transferred.');
    }

    public function settings(Project $project)
    {
        $role = $project->roleFor(Auth::user());

        if (! in_array($role, ['owner', 'manager'])) {
            abort(403);
        }

        $project->load('members');

        return Inertia::render('Projects/Settings', [
            'project' => $project,
            'role' => $role,
        ]);
    }

    public function logs(Project $project)
    {
        $role = $project->roleFor(Auth::user());

        if (! in_array($role, ['owner', 'manager'])) {
            abort(403);
        }

        $logs = $project->activityLogs()->with('user')->get();

        return Inertia::render('Projects/Logs', [
            'project' => $project,
            'logs' => $logs,
        ]);
    }
}