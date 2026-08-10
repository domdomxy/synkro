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
     * including via a notification link. Deliberately neutral wording - this fires
     * identically whether the person was removed, left on their own, or never had
     * access in the first place (e.g. guessing an ID, or a stale/forwarded link),
     * and there's no reliable way from here to tell those apart, so the message
     * never implies a history that might not be true.
     */
    public function view(User $user, Project $project): bool|Response
    {
        return $project->isMember($user)
            ? true
            : Response::deny("You don't have access to this project.");
    }

    public function create(User $user): bool
    {
        return true; // any authenticated user can start a project
    }

    /**
     * A trashed project (soft-deleted, still inside its grace period) is frozen -
     * reachable for viewing/downloading only, same as the read-only banner tells
     * anyone opening it. This is the actual enforcement backing that banner: even
     * an owner/manager hitting the write routes directly can't mutate a project
     * while it sits in the trash. Restoring it first is the only way back in.
     */
    public function update(User $user, Project $project): bool
    {
        return ! $project->trashed() && in_array($project->roleFor($user), ['owner', 'manager']);
    }

    /** Frozen while already trashed - see update()'s docblock; there's nothing left to request deletion of. */
    public function delete(User $user, Project $project): bool
    {
        return ! $project->trashed() && $project->roleFor($user) === 'owner';
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

    /** Frozen while trashed - see update()'s docblock. */
    public function manageMembers(User $user, Project $project): bool
    {
        return ! $project->trashed() && in_array($project->roleFor($user), ['owner', 'manager']);
    }

    /**
     * Upload, rename/edit, replace, or delete a project resource (package/source/reference file).
     * Frozen while trashed - see update()'s docblock.
     */
    public function manageResources(User $user, Project $project): bool
    {
        return ! $project->trashed() && in_array($project->roleFor($user), ['owner', 'manager']);
    }
}