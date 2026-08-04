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
     *
     * Also lists the still-active projects/tasks this user is allowed to delete
     * (see ProjectPolicy::delete()/TaskPolicy::delete()), so the page can offer a
     * "delete from here" picker instead of requiring a trip to each project/task
     * individually. Projects already mid deletion-request are left out of that
     * picker - see deleteExisting()'s docblock for why.
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

        return Inertia::render('Trash', [
            'trashedProjects' => $trashedProjects,
            'trashedTasks' => $trashedTasks,
            'deletableProjects' => $deletableProjects,
            'deletableTasks' => $deletableTasks,
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

    /**
     * Deletes selected still-active (not-yet-trashed) projects and/or tasks,
     * picked from the "delete from here" section of the Trash page rather than
     * from each project/task individually.
     *
     * Tasks are moved to trash immediately - this just delegates to
     * TaskController::destroy(), the same single-task delete path used from a
     * project page, so the notification/activity-log/broadcast side effects
     * stay in one place.
     *
     * Projects are NOT trashed here. Deleting a project always requires the
     * owner to confirm by email (see ProjectController::destroy()'s docblock) -
     * that safeguard doesn't get bypassed just because the request originated
     * from a bulk picker. Every selected project starts its deletion request
     * (via ProjectController::requestDeletion(), same per-project notifications
     * as a single delete), but rather than one confirmation email per project,
     * a batch of two or more gets a single combined email with one confirm link
     * for all of them - see ProjectController::sendDeletionConfirmationEmailBatch().
     * The project itself only moves to trash once that link is clicked.
     *
     * Items the user can't act on, or a project with a deletion already
     * pending, are silently skipped and counted rather than 403'd - a stale
     * selection shouldn't blow up the whole batch. Plain whereIn() queries
     * (rather than onlyTrashed()) are enough to keep already-trashed items
     * out: Eloquent's soft-delete scope excludes them by default.
     *
     * Each delegated call is individually try/caught: destroy() on either
     * controller does real work beyond the DB write (queues a mail, logs
     * activity, broadcasts) that can throw for reasons that have nothing to
     * do with authorization - a mail failure on the 2nd of 3 selected items,
     * say. Without the try/catch here, that exception would bubble out of
     * the whole request and silently abort every item after it, even though
     * the ones before it had already gone through - "I selected two, only
     * one actually got deleted" with no error shown. Catching per item means
     * a failure only costs that one item (counted as skipped, and reported
     * for investigation) instead of the rest of the batch.
     */
    public function deleteExisting(Request $request)
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

        $requestedProjects = collect();
        $skipped = 0;

        foreach (Project::whereIn('id', $projectIds)->get() as $project) {
            if (! $user->can('delete', $project) || $project->hasPendingDeletion()) {
                $skipped++;
                continue;
            }

            try {
                $projectController->requestDeletion($project);
                $requestedProjects->push($project);
            } catch (\Throwable $e) {
                report($e);
                $skipped++;
            }
        }

        // One combined confirmation email for a multi-project batch instead of
        // one per project (see this method's docblock); a single-project
        // selection still gets the normal per-project email so it looks and
        // reads exactly like deleting from that project's own settings page.
        if ($requestedProjects->count() === 1) {
            $projectController->sendDeletionConfirmationEmail($requestedProjects->first());
        } elseif ($requestedProjects->count() > 1) {
            $projectController->sendDeletionConfirmationEmailBatch($requestedProjects);
        }

        $deletedTasks = 0;

        foreach (Task::whereIn('id', $taskIds)->get() as $task) {
            if (! $user->can('delete', $task)) {
                $skipped++;
                continue;
            }

            try {
                $taskController->destroy($task);
                $deletedTasks++;
            } catch (\Throwable $e) {
                report($e);
                $skipped++;
            }
        }

        return back()->with('success', $this->deleteExistingResultMessage($requestedProjects->count(), $deletedTasks, $skipped));
    }

    private function deleteExistingResultMessage(int $projects, int $tasks, int $skipped): string
    {
        $parts = [];
        if ($tasks > 0) {
            $parts[] = ($tasks === 1 ? '1 task' : "{$tasks} tasks") . ' moved to trash';
        }
        if ($projects > 0) {
            $parts[] = 'deletion confirmation email sent for ' . ($projects === 1 ? '1 project' : "{$projects} projects");
        }

        $message = $parts ? ucfirst(implode('; ', $parts)) . '.' : 'Nothing was deleted.';

        if ($skipped > 0) {
            $message .= " {$skipped} item" . ($skipped === 1 ? '' : 's') . ' skipped.';
        }

        return $message;
    }
}
