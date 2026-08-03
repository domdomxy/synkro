<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TrashController extends Controller
{
    /**
     * Lists what this user can act on in the trash: projects they own that are
     * soft-deleted, and independently-trashed tasks (project itself still active)
     * in projects where they're owner or manager - matching ProjectPolicy::restore()/
     * forceDelete() and TaskPolicy::restore()/forceDelete() exactly, so nothing shown
     * here 403s when acted on.
     *
     * Tasks trashed alongside their project (see Project::booted()) aren't listed
     * separately - restoring or permanently deleting the project already covers them.
     */
    public function index()
    {
        $user = Auth::user();

        $trashedProjects = Project::onlyTrashed()
            ->where('owner_id', $user->id)
            ->withCount('tasks')
            ->orderByDesc('deleted_at')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'tasks_count' => $project->tasks_count,
                'deleted_at' => $project->deleted_at,
                'grace_ends_at' => $project->deletionGraceEndsAt(),
            ]);

        $managedProjectIds = $user->projects()
            ->wherePivotIn('role', ['owner', 'manager'])
            ->pluck('projects.id');

        $trashedTasks = Task::onlyTrashed()
            ->whereIn('project_id', $managedProjectIds)
            ->whereHas('project', fn ($query) => $query->whereNull('deleted_at'))
            ->with('project:id,name')
            ->orderByDesc('deleted_at')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
                'project_name' => $task->project->name,
                'deleted_at' => $task->deleted_at,
                'grace_ends_at' => $task->deletionGraceEndsAt(),
            ]);

        return Inertia::render('Trash', [
            'trashedProjects' => $trashedProjects,
            'trashedTasks' => $trashedTasks,
        ]);
    }
}
