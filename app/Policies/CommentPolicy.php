<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentPolicy
{
    /** Frozen while the project is trashed - see ProjectPolicy::update()'s docblock. */
    public function create(User $user, Task $task): bool
    {
        return ! $task->project->trashed() && $task->project->isMember($user);
    }

    /** Frozen while the project is trashed - see ProjectPolicy::update()'s docblock. */
    public function delete(User $user, Comment $comment): bool
    {
        if ($comment->task->project->trashed()) {
            return false;
        }

        return $comment->user_id === $user->id
            || in_array($comment->task->project->roleFor($user), ['owner', 'manager']);
    }
}