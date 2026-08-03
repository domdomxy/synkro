<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // index filters to the user's own projects in the controller
    }

    /**
     * This is the check that runs whenever a project (or a task within it) is opened,
     * including via a notification link. Its denial message is the one place that should
     * ever say "you may have left or been removed" - see the fallback comment in
     * bootstrap/app.php for why that message isn't just the generic 403 default anymore.
     */
    public function view(User $user, Project $project): bool|Response
    {
        return $project->isMember($user)
            ? true
            : Response::deny('You no longer have access to that — you may have left or been removed from the project.');
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

    /** Restoring or permanently deleting a trashed project is owner-only, same as trashing it in the first place. */
    public function restore(User $user, Project $project): bool
    {
        return $project->roleFor($user) === 'owner';
    }

    public function forceDelete(User $user, Project $project): bool
    {
        return $project->roleFor($user) === 'owner';
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return in_array($project->roleFor($user), ['owner', 'manager']);
    }

    /** Upload, rename/edit, replace, or delete a project resource (package/source/reference file). */
    public function manageResources(User $user, Project $project): bool
    {
        return in_array($project->roleFor($user), ['owner', 'manager']);
    }
}