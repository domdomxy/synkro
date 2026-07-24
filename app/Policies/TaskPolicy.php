<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function create(User $user, Project $project): bool
    {
        return in_array($project->roleFor($user), ['owner', 'manager']);
    }

    /**
     * General "you may act on this task" gate — used by start(), submit(), and
     * destroyDeliverable(). Deliberately stays open to the assignee: those routes
     * are how an assignee progresses their own work and manages their own
     * submitted files/links before review, and must keep working for them.
     */
    public function update(User $user, Task $task): bool
    {
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
        return in_array($task->project->roleFor($user), ['owner', 'manager']);
    }

    public function delete(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'manager']);
    }
    public function review(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'manager', 'tester']);
    }
}