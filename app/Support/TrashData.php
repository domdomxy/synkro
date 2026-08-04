<?php

namespace App\Support;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

/**
 * What a user can see and act on in their trash: projects they own that are
 * soft-deleted, and independently-trashed tasks (project itself still active)
 * in projects where they're owner or manager - matching ProjectPolicy::restore()/
 * forceDelete() and TaskPolicy::restore()/forceDelete() exactly, so nothing this
 * returns 403s when acted on.
 *
 * Tasks trashed alongside their project (see Project::booted()) aren't listed
 * separately - restoring or permanently deleting the project already covers them.
 *
 * Also includes the still-active projects/tasks this user is allowed to delete
 * (see ProjectPolicy::delete()/TaskPolicy::delete()), so the Trash section of
 * Settings can offer a "delete from here" picker instead of requiring a trip to
 * each project/task individually. Projects already mid deletion-request are left
 * out of that picker - see TrashController::deleteExisting()'s docblock for why.
 *
 * Extracted out of what used to be TrashController::index() so the exact same
 * scoping backs both the Settings > Trash panel (SettingsController::edit()) and
 * the trash action endpoints (TrashController), instead of two copies drifting
 * apart over time.
 */
class TrashData
{
    public static function forUser(User $user): array
    {
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
                // projects.show is withTrashed() (see routes/web.php) and
                // Projects/Show.jsx already renders a read-only banner and
                // freezes every mutating control while `project.deleted_at` is
                // set - see TaskPolicy/ProjectPolicy/CommentPolicy trashed()
                // checks for the backend side of that freeze. This just lets
                // the owner click straight into that view from the trash list.
                'url' => route('projects.show', $project->id),
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

        $deletableProjects = Project::where('owner_id', $user->id)
            ->whereNull('deletion_requested_at')
            ->withCount('tasks')
            ->orderBy('name')
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'tasks_count' => $project->tasks_count,
            ]);

        $deletableTasks = Task::whereIn('project_id', $managedProjectIds)
            ->with('project:id,name')
            ->orderBy('title')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
                'project_name' => $task->project->name,
            ]);

        return [
            'trashedProjects' => $trashedProjects,
            'trashedTasks' => $trashedTasks,
            'deletableProjects' => $deletableProjects,
            'deletableTasks' => $deletableTasks,
        ];
    }
}
