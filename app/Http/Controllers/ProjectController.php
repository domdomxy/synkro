<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Support\NotificationMailer;
use App\Support\Linkifier;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index()
    {
        $showArchived = request()->boolean('archived');

        $projects = Auth::user()->projects()
            ->with('owner')
            ->wherePivot('archived', $showArchived)
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($query) => $query->where('status', 'done'),
            ])
            ->get()
            ->sortByDesc(fn ($p) => $p->pivot->pinned)
            ->values();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'showingArchived' => $showArchived,
        ]);
    }

    public function archive(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['archived' => true]);
        return back()->with('success', 'Project archived.');
    }

    public function unarchive(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['archived' => false]);
        return back()->with('success', 'Project unarchived.');
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

        $validated['description'] = strip_tags($validated['description'] ?? '', '<b><strong><i><em><u><span><br><p><div>');
        $validated['description'] = Linkifier::linkify($validated['description']);

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

        $pinnedTaskIds = Auth::user()->pinnedTasks()->pluck('tasks.id')->toArray();

        $sortedTasks = $project->tasks
            ->map(function ($task) use ($pinnedTaskIds) {
                $task->is_pinned = in_array($task->id, $pinnedTaskIds);
                return $task;
            })
            ->sortByDesc('is_pinned')
            ->values();

        $project->setRelation('tasks', $sortedTasks);

        $notes = $project->notes()->where('user_id', Auth::id())->latest()->get();

        $pendingInvitations = $project->invitations()->where('status', 'pending')->with('invitedUser')->get();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'role' => $project->roleFor(Auth::user()),
            'myNotes' => $notes,
            'pendingInvitations' => $pendingInvitations,
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

        $validated['description'] = strip_tags($validated['description'] ?? '', '<b><strong><i><em><u><span><br><p><div>');
        $validated['description'] = Linkifier::linkify($validated['description']);

        $changes = [];
        foreach (['name', 'description'] as $field) {
            if ($project->{$field} !== $validated[$field]) {
                $changes[$field] = ['old' => $project->{$field}, 'new' => $validated[$field]];
            }
        }

        $project->update($validated);

        if (! empty($changes)) {
            ProjectActivityLog::log($project, 'project_updated', ['changes' => $changes]);

            $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();
            foreach ($recipients as $recipient) {
                NotificationMailer::send(
                    $recipient,
                    'project.edited',
                    "{$project->name} was updated",
                    ["The project \"{$project->name}\" (ID {$project->id}) you belong to was edited."],
                    url(route('projects.show', $project->id, false)),
                    'View Project'
                );
            }
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

        NotificationMailer::send(
            $newOwner,
            'project.ownership_transferred',
            "You now own {$project->name}",
            ["Ownership of \"{$project->name}\" was transferred to you."],
            url(route('projects.show', $project->id, false)),
            'View Project'
        );

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
    public function pin(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['pinned' => true]);
        return back()->with('success', 'Project pinned.');
    }

    public function unpin(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['pinned' => false]);
        return back()->with('success', 'Project unpinned.');
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