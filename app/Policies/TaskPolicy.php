<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /** Frozen while the project is trashed - see ProjectPolicy::update()'s docblock. */
    public function create(User $user, Project $project): bool
    {
        return ! $project->trashed() && in_array($project->roleFor($user), ['owner', 'manager']);
    }

    /**
     * General "you may act on this task" gate — used by start(), submit(), and
     * destroyDeliverable(). Deliberately stays open to the assignee: those routes
     * are how an assignee progresses their own work and manages their own
     * submitted files/links before review, and must keep working for them.
     * Frozen while the project is trashed, same as every other write here - see
     * ProjectPolicy::update()'s docblock. That freeze applies to the assignee too:
     * a trashed project is fully read-only for everyone, not just owner/manager.
     */
    public function update(User $user, Task $task): bool
    {
        if ($task->project->trashed()) {
            return false;
        }

        $role = $task->project->roleFor($user);

        return in_array($role, ['owner', 'manager']) || $task->assigned_to === $user->id;
    }

    /**
     * Full task edit (title, description, due date, reassignment) is owner/manager
     * only. This is the gate that used to be missing: previously TaskController::update()
     * authorized against 'update' above, which meant an assignee could hit
     * PATCH /tasks/{task} directly and rewrite the title/description or reassign the
     * task to someone else, even though the UI never gave them that form. In a solo
     * project the same user simply holds the owner role, so this adds no friction for
     * single-person use — they always pass this check on their own tasks.
     */
    public function edit(User $user, Task $task): bool
    {
        return ! $task->project->trashed() && in_array($task->project->roleFor($user), ['owner', 'manager']);
    }

    public function delete(User $user, Task $task): bool
    {
        return ! $task->project->trashed() && in_array($task->project->roleFor($user), ['owner', 'manager']);
    }

    /** Restoring or permanently deleting a trashed task is owner/manager-only, same as trashing it in the first place. */
    public function restore(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'manager']);
    }

    public function forceDelete(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'manager']);
    }

    /** Frozen while the project is trashed - see update()'s docblock. */
    public function review(User $user, Task $task): bool
    {
        return ! $task->project->trashed() && in_array($task->project->roleFor($user), ['owner', 'manager', 'tester']);
    }

    /**
     * Adding or removing a checklist item: owner, manager, or tester - not the
     * assignee. The assignee's only checklist action is checking items done or
     * undone (see TaskChecklistItemController::update()'s separate 'done' check);
     * managing which items exist is left to whoever's running/reviewing the
     * project. Removing one is gated by this same check in the controller, but a
     * tester (unlike owner/manager) is further restricted there to items they
     * added themselves - see TaskChecklistItemController::destroy().
     * Frozen while the project is trashed - see update()'s docblock.
     */
    public function manageChecklist(User $user, Task $task): bool
    {
        return ! $task->project->trashed() && in_array($task->project->roleFor($user), ['owner', 'manager', 'tester']);
    }
}