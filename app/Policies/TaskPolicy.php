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

    public function update(User $user, Task $task): bool
    {
        $role = $task->project->roleFor($user);

        return in_array($role, ['owner', 'manager']) || $task->assigned_to === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'manager']);
    }
    public function review(User $user, Task $task): bool
    {
        return in_array($task->project->roleFor($user), ['owner', 'tester']);
    }
}