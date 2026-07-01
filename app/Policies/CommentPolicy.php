<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentPolicy
{
    public function create(User $user, Task $task): bool
    {
        return $task->project->isMember($user);
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $comment->user_id === $user->id
            || in_array($comment->task->project->roleFor($user), ['owner', 'manager']);
    }
}