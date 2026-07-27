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
use App\Events\CommentUpdated;
use App\Events\TaskCommented;
use App\Events\TaskMentioned;
use App\Support\MentionParser;
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
        ], $task);

        broadcast(new CommentPosted($comment))->toOthers();

        // Anyone @mentioned (by name or by role) gets the stronger "mentioned" signal
        // instead of the generic "commented" one below, so they aren't notified twice
        // for the same comment.
        $mentions = MentionParser::extract($validated['body']);
        $mentionedRecipients = MentionParser::resolveRecipients($task->project, $mentions, Auth::id());
        $mentionedIds = $mentionedRecipients->pluck('id');

        // Recipients = the assignee plus anyone else who has commented on this task
        // (i.e. the thread's participants), minus whoever just posted. Previously only
        // the assignee was notified, so a manager/tester replying to another manager's
        // comment never reached them. In a solo project this naturally resolves to an
        // empty list (no one else to notify), so nothing changes for single-person use.
        // The assignee is pushed in unconditionally below, so it also has to be filtered
        // out again afterwards, not just from the comments query above, or an assignee
        // commenting on their own task would end up notifying themselves.
        $recipientIds = $task->comments()
            ->where('user_id', '!=', Auth::id())
            ->pluck('user_id')
            ->push($task->assigned_to)
            ->filter()
            ->reject(fn ($id) => (int) $id === (int) Auth::id())
            ->reject(fn ($id) => $mentionedIds->contains((int) $id))
            ->unique();

        $preview = Str::limit($validated['body'], 200);
        $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
        $recipients = \App\Models\User::whereIn('id', $recipientIds)
            ->get()
            ->filter(fn ($user) => $task->project->isMember($user));

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

        foreach ($mentionedRecipients as $recipient) {
            if (NotificationPreferences::wantsType($recipient, 'task_mentioned')) {
                $notification = UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'task_mentioned',
                    'message' => "You were mentioned\n" . Auth::user()->name . " mentioned you on \"{$task->title}\"",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskMentioned($comment, $recipient->id, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $recipient,
                'task.mentioned',
                Auth::user()->name . " mentioned you on \"{$task->title}\"",
                [Auth::user()->name . " mentioned you in a comment on \"{$task->title}\":"],
                url($url),
                'View Task',
                ['label' => 'Comment', 'content' => $preview]
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
        ], $task);

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

        broadcast(new CommentUpdated($comment->task->project_id))->toOthers();

        if ($oldBody !== $validated['body']) {
            $task = $comment->task;
            ProjectActivityLog::log($task->project, 'comment_edited', [
                'task_title' => $task->title,
                'old_preview' => Str::limit($oldBody, 200),
                'new_preview' => Str::limit($validated['body'], 200),
            ], $task);

            // Only notify people newly swept in by the edit — anyone already mentioned
            // (or resolved via a role they already held) before the edit was made has
            // presumably already seen the original comment, so re-notifying them here
            // would just be noise.
            $oldMentionedIds = MentionParser::resolveRecipients(
                $task->project,
                MentionParser::extract($oldBody),
                Auth::id()
            )->pluck('id');

            $newMentionedRecipients = MentionParser::resolveRecipients(
                $task->project,
                MentionParser::extract($validated['body']),
                Auth::id()
            )->reject(fn ($user) => $oldMentionedIds->contains($user->id));

            $preview = Str::limit($validated['body'], 200);
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

            foreach ($newMentionedRecipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'task_mentioned')) {
                    $notification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'task_mentioned',
                        'message' => "You were mentioned\n" . Auth::user()->name . " mentioned you on \"{$task->title}\"",
                        'url' => $url,
                    ]);

                    try {
                        broadcast(new TaskMentioned($comment, $recipient->id, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $recipient,
                    'task.mentioned',
                    Auth::user()->name . " mentioned you on \"{$task->title}\"",
                    [Auth::user()->name . " mentioned you in a comment on \"{$task->title}\":"],
                    url($url),
                    'View Task',
                    ['label' => 'Comment', 'content' => $preview]
                );
            }
        }

        return back();
    }
}