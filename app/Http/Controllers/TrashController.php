<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
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

    /**
     * Bulk-restores whichever selected projects/tasks the user is allowed to
     * restore. Delegates each individual restore to ProjectController::restore()/
     * TaskController::restore() so the notification, activity-log, and broadcast
     * side effects stay in exactly one place instead of being duplicated here.
     * Items the user can't act on (or that no longer qualify, e.g. a task whose
     * project is still trashed) are silently skipped and counted, never 403'd -
     * a stale selection shouldn't blow up the whole batch.
     */
    public function restoreSelected(Request $request)
    {
        $validated = $request->validate([
            'project_ids' => ['array'],
            'project_ids.*' => ['integer'],
            'task_ids' => ['array'],
            'task_ids.*' => ['integer'],
        ]);

        $projectIds = $validated['project_ids'] ?? [];
        $taskIds = $validated['task_ids'] ?? [];

        if (empty($projectIds) && empty($taskIds)) {
            return back()->withErrors(['error' => 'Nothing selected to restore.']);
        }

        $user = Auth::user();
        $projectController = new ProjectController();
        $taskController = new TaskController();

        $restoredProjects = 0;
        $skipped = 0;

        foreach (Project::onlyTrashed()->whereIn('id', $projectIds)->get() as $project) {
            if (! $user->can('restore', $project)) {
                $skipped++;
                continue;
            }

            $projectController->restore($project);
            $restoredProjects++;
        }

        $restoredTasks = 0;

        foreach (Task::onlyTrashed()->whereIn('id', $taskIds)->get() as $task) {
            if ($task->project->trashed() || ! $user->can('restore', $task)) {
                $skipped++;
                continue;
            }

            $taskController->restore($task);
            $restoredTasks++;
        }

        return back()->with('success', $this->bulkResultMessage('restored', $restoredProjects, $restoredTasks, $skipped));
    }

    /**
     * Bulk-permanently-deletes whichever selected projects/tasks the user is
     * allowed to force-delete. Same delegation pattern as restoreSelected() -
     * see that method's docblock.
     */
    public function forceDeleteSelected(Request $request)
    {
        $validated = $request->validate([
            'project_ids' => ['array'],
            'project_ids.*' => ['integer'],
            'task_ids' => ['array'],
            'task_ids.*' => ['integer'],
        ]);

        $projectIds = $validated['project_ids'] ?? [];
        $taskIds = $validated['task_ids'] ?? [];

        if (empty($projectIds) && empty($taskIds)) {
            return back()->withErrors(['error' => 'Nothing selected to delete.']);
        }

        $user = Auth::user();
        $projectController = new ProjectController();
        $taskController = new TaskController();

        $deletedProjects = 0;
        $skipped = 0;

        foreach (Project::onlyTrashed()->whereIn('id', $projectIds)->get() as $project) {
            if (! $user->can('forceDelete', $project)) {
                $skipped++;
                continue;
            }

            $projectController->forceDeleteProject($project);
            $deletedProjects++;
        }

        $deletedTasks = 0;

        foreach (Task::onlyTrashed()->whereIn('id', $taskIds)->get() as $task) {
            if (! $user->can('forceDelete', $task)) {
                $skipped++;
                continue;
            }

            $taskController->forceDelete($task);
            $deletedTasks++;
        }

        return back()->with('success', $this->bulkResultMessage('permanently deleted', $deletedProjects, $deletedTasks, $skipped));
    }

    private function bulkResultMessage(string $verb, int $projects, int $tasks, int $skipped): string
    {
        $parts = [];
        if ($projects > 0) {
            $parts[] = $projects === 1 ? '1 project' : "{$projects} projects";
        }
        if ($tasks > 0) {
            $parts[] = $tasks === 1 ? '1 task' : "{$tasks} tasks";
        }

        $message = $parts ? implode(' and ', $parts) . " {$verb}." : 'Nothing was ' . $verb . '.';

        if ($skipped > 0) {
            $message .= " {$skipped} item" . ($skipped === 1 ? '' : 's') . ' skipped.';
        }

        return $message;
    }
}
