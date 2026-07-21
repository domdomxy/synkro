<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\CommentPosted;
use App\Events\CommentDeleted;
use App\Events\TaskCommented;
use App\Support\NotificationMailer;

class CommentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('create', [Comment::class, $task]);

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $comment = $task->comments()->create([
            'user_id' => Auth::id(),
            'body' => $validated['body'],
        ]);

        broadcast(new CommentPosted($comment))->toOthers();

        if ($task->assigned_to && $task->assigned_to !== Auth::id()) {
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

            $notification = UserNotification::create([
                'user_id' => $task->assigned_to,
                'type' => 'task_commented',
                'message' => "New comment\n" . Auth::user()->name . " commented on \"{$task->title}\"",
                'url' => $url,
            ]);

            try {
                broadcast(new TaskCommented($comment, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }

            $preview = \Illuminate\Support\Str::limit($validated['body'], 200);

            NotificationMailer::send(
                $task->assignee,
                'task.commented',
                Auth::user()->name . " commented on \"{$task->title}\"",
                [Auth::user()->name . " commented on your task \"{$task->title}\": \"{$preview}\""],
                url($url),
                'View Task'
            );
        }

        return back()->with('success', 'Comment added.');
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $projectId = $comment->task->project_id;
        $comment->delete();

        broadcast(new CommentDeleted($projectId))->toOthers();
        
        return back()->with('success', 'Comment deleted.');
    }
    public function update(Request $request, Comment $comment)
    {
        abort_unless($comment->user_id === Auth::id(), 403);

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $comment->update([
            'body' => $validated['body'],
            'edited_at' => now(),
        ]);

        return back();
    }
}