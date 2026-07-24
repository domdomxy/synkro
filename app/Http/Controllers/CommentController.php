<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\ProjectActivityLog;
use App\Models\Task;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use App\Events\CommentPosted;
use App\Events\CommentDeleted;
use App\Events\TaskCommented;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;

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

        ProjectActivityLog::log($task->project, 'comment_added', [
            'task_title' => $task->title,
            'preview' => Str::limit($validated['body'], 200),
        ]);

        broadcast(new CommentPosted($comment))->toOthers();

        // Recipients = the assignee plus anyone else who has commented on this task
        // (i.e. the thread's participants), minus whoever just posted. Previously only
        // the assignee was notified, so a manager/tester replying to another manager's
        // comment never reached them. In a solo project this naturally resolves to an
        // empty list (no one else to notify), so nothing changes for single-person use.
        $recipientIds = $task->comments()
            ->where('user_id', '!=', Auth::id())
            ->pluck('user_id')
            ->push($task->assigned_to)
            ->filter()
            ->unique();

        $preview = Str::limit($validated['body'], 200);
        $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
        $recipients = \App\Models\User::whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            if (NotificationPreferences::wantsType($recipient, 'task_commented')) {
                $notification = UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'task_commented',
                    'message' => "New comment\n" . Auth::user()->name . " commented on \"{$task->title}\"",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskCommented($comment, $recipient->id, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $recipient,
                'task.commented',
                Auth::user()->name . " commented on \"{$task->title}\"",
                [Auth::user()->name . " commented on \"{$task->title}\": \"{$preview}\""],
                url($url),
                'View Task'
            );
        }

        return back()->with('success', 'Comment added.');
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $task = $comment->task;
        $projectId = $task->project_id;

        ProjectActivityLog::log($task->project, 'comment_deleted', [
            'task_title' => $task->title,
            'preview' => Str::limit($comment->body, 200),
        ]);

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

        $oldBody = $comment->body;

        $comment->update([
            'body' => $validated['body'],
            'edited_at' => now(),
        ]);

        if ($oldBody !== $validated['body']) {
            $task = $comment->task;
            ProjectActivityLog::log($task->project, 'comment_edited', [
                'task_title' => $task->title,
                'old_preview' => Str::limit($oldBody, 200),
                'new_preview' => Str::limit($validated['body'], 200),
            ]);
        }

        return back();
    }
}