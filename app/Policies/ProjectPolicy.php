<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // index filters to the user's own projects in the controller
    }

    public function view(User $user, Project $project): bool
    {
        return $project->isMember($user);
    }

    public function create(User $user): bool
    {
        return true; // any authenticated user can start a project
    }

    public function update(User $user, Project $project): bool
    {
        return in_array($project->roleFor($user), ['owner', 'manager']);
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->roleFor($user) === 'owner';
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return in_array($project->roleFor($user), ['owner', 'manager']);
    }
}