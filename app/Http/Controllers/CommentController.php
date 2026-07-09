<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\CommentPosted;
use App\Events\CommentDeleted;

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