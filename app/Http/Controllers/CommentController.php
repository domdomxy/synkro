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
use App\Events\NotificationDeleted;
use App\Events\NotificationUpdated;
use App\Events\TaskCommented;
use App\Events\TaskMentioned;
use App\Events\CommentReplied;
use App\Support\MentionParser;
use App\Support\NotificationMailer;
use App\Support\NotificationPiler;
use App\Support\NotificationPreferences;

class CommentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('create', [Comment::class, $task]);

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
            'parent_id' => 'nullable|integer|exists:comments,id',
        ]);

        $parentComment = null;
        if (! empty($validated['parent_id'])) {
            $parentComment = Comment::find($validated['parent_id']);
            // A reply only makes sense within the same task's thread - reject
            // anything else rather than silently dropping the parent link.
            abort_unless($parentComment && (int) $parentComment->task_id === (int) $task->id, 422, 'Invalid reply target.');
        }

        $comment = $task->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $parentComment?->id,
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

        // @everyone pings the whole project at once, so only managers/owners
        // may use it - the frontend already hides it from the suggestion list
        // for anyone else, this is the backstop.
        if (in_array('everyone', $mentions['roles'], true) && ! in_array($task->project->roleFor(Auth::user()), ['owner', 'manager'], true)) {
            return back()->withErrors(['body' => 'Only managers and owners can mention everyone.'])->withInput();
        }

        $mentionedRecipients = MentionParser::resolveRecipients($task->project, $mentions, Auth::id());
        $mentionedIds = $mentionedRecipients->pluck('id');

        // Replying to someone gives them the stronger "replied to your comment"
        // signal instead of the generic "commented" one below (and instead of
        // "mentioned", if they were also @mentioned - one notification per
        // comment per person is enough).
        $replyToUserId = ($parentComment && (int) $parentComment->user_id !== (int) Auth::id())
            ? (int) $parentComment->user_id
            : null;

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
            ->reject(fn ($id) => (int) $id === $replyToUserId)
            ->unique();

        $preview = Str::limit($validated['body'], 200);
        $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id . '&comment=' . $comment->id;
        $recipients = \App\Models\User::whereIn('id', $recipientIds)
            ->get()
            ->filter(fn ($user) => $task->project->isMember($user));

        // Muting a task suppresses comment-driven signals for it on whichever channel(s)
        // were chosen - the bell notification, the email, or both - regardless of the
        // person's broader account-wide preferences. Muting the whole project has the
        // same effect across every task in it. Both are fetched once up front rather
        // than per-recipient to avoid a query per person in the loops below.
        $mutedInAppUserIds = $task->mutedBy()->wherePivot('mute_in_app', true)->pluck('users.id')
            ->merge($task->project->members()->wherePivot('mute_in_app', true)->pluck('users.id'))
            ->unique()
            ->all();
        $mutedEmailUserIds = $task->mutedBy()->wherePivot('mute_email', true)->pluck('users.id')
            ->merge($task->project->members()->wherePivot('mute_email', true)->pluck('users.id'))
            ->unique()
            ->all();

        foreach ($recipients as $recipient) {
            $inAppMuted = in_array($recipient->id, $mutedInAppUserIds, true);
            $emailMuted = in_array($recipient->id, $mutedEmailUserIds, true);

            if (! $inAppMuted && NotificationPreferences::wantsType($recipient, 'task_commented')) {
                // Piled by task: a burst of comments on the same task collapses
                // into one "You have N new comments on ..." row instead of N
                // separate bell notifications, as long as it stays unread.
                $piled = NotificationPiler::pile(
                    [
                        'user_id' => $recipient->id,
                        'type' => 'task_commented',
                        'causer_id' => Auth::id(),
                        'url' => $url,
                        'group_key' => "task:{$task->id}",
                    ],
                    "New comment\n" . '**' . Auth::user()->name . '**' . " commented on \"**{$task->title}**\"",
                    fn ($count) => "New comments\nYou have **{$count}** new comments on \"**{$task->title}**\"",
                    $comment->id
                );
                $notification = $piled['notification'];

                try {
                    broadcast(new TaskCommented($comment, $recipient->id, $notification->id, $notification->pile_count, $piled['is_new']))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            if (! $emailMuted) {
                NotificationMailer::send(
                    $recipient,
                    'task.commented',
                    Auth::user()->name . " commented on \"{$task->title}\"",
                    ['**' . Auth::user()->name . '**' . " commented on \"**{$task->title}**\": \"{$preview}\""],
                    url($url),
                    'View Task'
                );
            }
        }

        foreach ($mentionedRecipients as $recipient) {
            $inAppMuted = in_array($recipient->id, $mutedInAppUserIds, true);
            $emailMuted = in_array($recipient->id, $mutedEmailUserIds, true);

            if (! $inAppMuted && NotificationPreferences::wantsType($recipient, 'task_mentioned')) {
                // Piled by task: several @mentions on the same task collapse
                // into one "You have N new mentions on ..." row while unread.
                $piled = NotificationPiler::pile(
                    [
                        'user_id' => $recipient->id,
                        'type' => 'task_mentioned',
                        'causer_id' => Auth::id(),
                        'url' => $url,
                        'group_key' => "task:{$task->id}",
                    ],
                    "You were mentioned\n" . '**' . Auth::user()->name . '**' . " mentioned you on \"**{$task->title}**\"",
                    fn ($count) => "You were mentioned\nYou have **{$count}** new mentions on \"**{$task->title}**\"",
                    $comment->id
                );
                $notification = $piled['notification'];

                try {
                    broadcast(new TaskMentioned($comment, $recipient->id, $notification->id, $notification->pile_count, $piled['is_new']))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            if (! $emailMuted) {
                NotificationMailer::send(
                    $recipient,
                    'task.mentioned',
                    Auth::user()->name . " mentioned you on \"{$task->title}\"",
                    ['**' . Auth::user()->name . '**' . " mentioned you in a comment on \"**{$task->title}**\":"],
                    url($url),
                    'View Task',
                    ['label' => 'Comment', 'content' => $preview]
                );
            }
        }

        if ($replyToUserId && ! $mentionedIds->contains($replyToUserId)) {
            $replyRecipient = \App\Models\User::find($replyToUserId);
            if ($replyRecipient && $task->project->isMember($replyRecipient)) {
                $inAppMuted = in_array($replyToUserId, $mutedInAppUserIds, true);
                $emailMuted = in_array($replyToUserId, $mutedEmailUserIds, true);

                if (! $inAppMuted && NotificationPreferences::wantsType($replyRecipient, 'comment_replied')) {
                    // Piled by the comment being replied to: several replies to the
                    // same comment collapse into one "You have N new replies on ..."
                    // row while unread, rather than a notification per reply.
                    $piled = NotificationPiler::pile(
                        [
                            'user_id' => $replyRecipient->id,
                            'type' => 'comment_replied',
                            'causer_id' => Auth::id(),
                            'url' => $url,
                            'group_key' => "comment:{$parentComment->id}",
                        ],
                        "New reply\n" . '**' . Auth::user()->name . '**' . " replied to your comment on \"**{$task->title}**\"",
                        fn ($count) => "New replies\nYou have **{$count}** new replies on \"**{$task->title}**\"",
                        $comment->id
                    );
                    $notification = $piled['notification'];

                    try {
                        broadcast(new CommentReplied($comment, $replyRecipient->id, $notification->id, $notification->pile_count, $piled['is_new']))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                if (! $emailMuted) {
                    NotificationMailer::send(
                        $replyRecipient,
                        'task.replied',
                        Auth::user()->name . " replied to your comment on \"{$task->title}\"",
                        ['**' . Auth::user()->name . '**' . " replied to your comment on \"**{$task->title}**\":"],
                        url($url),
                        'View Reply',
                        ['label' => 'Reply', 'content' => $preview]
                    );
                }
            }
        }

        return back()->with('success', 'Comment added.');
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $task = $comment->task;
        $projectId = $task->project_id;
        $isModerator = in_array($task->project->roleFor(Auth::user()), ['owner', 'manager'], true);

        // A tombstoned comment ("Original comment was deleted") has nothing
        // left that its own author could delete - the body's already gone.
        // Only a moderator can act on it from here, and what they're doing
        // is purging the tombstone itself: the placeholder and every reply
        // beneath it disappear for good, same as a moderator deleting any
        // other comment. Anyone else hitting this route is stale UI.
        if ($comment->is_deleted) {
            abort_unless($isModerator, 404);

            ProjectActivityLog::log($task->project, 'comment_deleted', [
                'task_title' => $task->title,
                'preview' => '[deleted]',
            ], $task);

            $descendantIds = $this->collectDescendantIds($comment);
            if (! empty($descendantIds)) {
                Comment::whereIn('id', $descendantIds)->delete();
            }
            $comment->delete();

            $this->purgeCommentNotifications($task, array_merge([$comment->id], $descendantIds));

            broadcast(new CommentDeleted($projectId))->toOthers();

            return back()->with('success', 'Comment deleted.');
        }

        ProjectActivityLog::log($task->project, 'comment_deleted', [
            'task_title' => $task->title,
            'preview' => Str::limit($comment->body, 200),
        ], $task);

        // An owner/manager deleting a comment is a moderation action - it and
        // every reply underneath it are permanently removed, no tombstone. Anyone
        // else (deleting their own comment) still can't blow away replies
        // that don't belong to them, so that path tombstones instead: the
        // body is cleared and deleted_at is stamped, and the frontend renders
        // it as "Original comment was deleted" while the replies stay right
        // where they were. Either way, a childless comment is just removed.
        if ($isModerator) {
            $descendantIds = $this->collectDescendantIds($comment);
            if (! empty($descendantIds)) {
                Comment::whereIn('id', $descendantIds)->delete();
            }
            $comment->delete();

            $this->purgeCommentNotifications($task, array_merge([$comment->id], $descendantIds));
        } elseif ($comment->replies()->exists()) {
            $comment->forceFill([
                'body' => '',
                'is_feedback' => false,
                'is_rejection' => false,
                'is_reopened' => false,
                'deleted_at' => now(),
            ])->save();

            // The row survives as a tombstone so replies stay put, but its
            // content is gone - any notification still pointing at it (a
            // comment/mention/reply row whose url references this exact
            // comment) would open onto "Original comment was deleted", so
            // it's purged the same as a hard delete.
            $this->purgeCommentNotifications($task, [$comment->id]);
        } else {
            $comment->delete();

            $this->purgeCommentNotifications($task, [$comment->id]);
        }

        broadcast(new CommentDeleted($projectId))->toOthers();
        
        return back()->with('success', 'Comment deleted.');
    }

    // Shrinks or removes any bell notification (task_commented, task_mentioned,
    // comment_replied) that traces back to one of the given comment ids. These
    // three types track exactly which comments fed each pile via source_ids
    // (see NotificationPiler::pile()), so deleting one of several piled
    // comments knocks the count down by one and rewrites the message/url to
    // point at whatever's left, rather than only being able to blow away the
    // whole notification. Deleting the last remaining source removes the row
    // outright. Recipients with the bell open get a live NotificationUpdated
    // (count went down) or NotificationDeleted (row gone); anyone else just
    // sees the correct state next time they load their notifications.
    private function purgeCommentNotifications(Task $task, array $commentIds): void
    {
        if (empty($commentIds)) {
            return;
        }

        $notifications = UserNotification::whereIn('type', ['task_commented', 'task_mentioned', 'comment_replied'])
            ->where(function ($query) use ($commentIds) {
                foreach ($commentIds as $id) {
                    $query->orWhereJsonContains('source_ids', $id);
                }
            })
            ->get();

        if ($notifications->isEmpty()) {
            return;
        }

        $singleTemplates = [
            'task_commented' => fn ($name) => "New comment\n**{$name}** commented on \"**{$task->title}**\"",
            'task_mentioned' => fn ($name) => "You were mentioned\n**{$name}** mentioned you on \"**{$task->title}**\"",
            'comment_replied' => fn ($name) => "New reply\n**{$name}** replied to your comment on \"**{$task->title}**\"",
        ];
        $pileTemplates = [
            'task_commented' => fn ($n) => "New comments\nYou have **{$n}** new comments on \"**{$task->title}**\"",
            'task_mentioned' => fn ($n) => "You were mentioned\nYou have **{$n}** new mentions on \"**{$task->title}**\"",
            'comment_replied' => fn ($n) => "New replies\nYou have **{$n}** new replies on \"**{$task->title}**\"",
        ];

        foreach ($notifications as $notification) {
            $remaining = array_values(array_diff($notification->source_ids ?? [], $commentIds));

            if (empty($remaining)) {
                $wasUnread = $notification->read_at === null;
                $notification->delete();

                try {
                    broadcast(new NotificationDeleted($notification->user_id, $notification->id, $wasUnread))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }

                continue;
            }

            $newCount = count($remaining);
            $lastRemainingComment = Comment::find(end($remaining));

            $notification->source_ids = $remaining;
            $notification->pile_count = $newCount;

            if ($newCount === 1 && $lastRemainingComment) {
                // Back down to a single event - revert to the non-piled
                // wording naming whoever's comment is actually left, instead
                // of a "You have 1 new comment..." that reads like a bug.
                $notification->message = $singleTemplates[$notification->type]($lastRemainingComment->user->name);
                $notification->causer_id = $lastRemainingComment->user_id;
            } else {
                $notification->message = $pileTemplates[$notification->type]($newCount);
            }

            if ($lastRemainingComment) {
                $notification->url = route('projects.show', $task->project_id, false) . '?task=' . $task->id . '&comment=' . $lastRemainingComment->id;
            }

            $notification->save();

            try {
                broadcast(new NotificationUpdated($notification->user_id, $notification->id, $notification->message, $notification->url, $notification->pile_count))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    // Depth-first collection of every reply id nested under $comment, however
    // many levels deep - parent_id only points one level up, so there's no
    // single query for "all descendants" without a recursive CTE.
    private function collectDescendantIds(Comment $comment): array
    {
        $ids = [];

        foreach ($comment->replies()->get() as $child) {
            $ids[] = $child->id;
            $ids = array_merge($ids, $this->collectDescendantIds($child));
        }

        return $ids;
    }

    public function update(Request $request, Comment $comment)
    {
        abort_unless($comment->user_id === Auth::id(), 403);
        abort_if($comment->is_deleted, 404);
        // Editing a comment doesn't run through CommentPolicy (only create/delete
        // do), so the trashed-project freeze needs its own check here too - see
        // CommentPolicy::create()'s docblock for why a trashed project is frozen.
        abort_if($comment->task->project->trashed(), 403, 'This project is in the trash and read-only.');

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $oldBody = $comment->body;

        $newMentions = MentionParser::extract($validated['body']);
        if (in_array('everyone', $newMentions['roles'], true) && ! in_array($comment->task->project->roleFor(Auth::user()), ['owner', 'manager'], true)) {
            return back()->withErrors(['body' => 'Only managers and owners can mention everyone.'])->withInput();
        }

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

            // Only notify people newly swept in by the edit - anyone already mentioned
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
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id . '&comment=' . $comment->id;
            $mutedInAppUserIds = $task->mutedBy()->wherePivot('mute_in_app', true)->pluck('users.id')
                ->merge($task->project->members()->wherePivot('mute_in_app', true)->pluck('users.id'))
                ->unique()
                ->all();
            $mutedEmailUserIds = $task->mutedBy()->wherePivot('mute_email', true)->pluck('users.id')
                ->merge($task->project->members()->wherePivot('mute_email', true)->pluck('users.id'))
                ->unique()
                ->all();

            foreach ($newMentionedRecipients as $recipient) {
                $inAppMuted = in_array($recipient->id, $mutedInAppUserIds, true);
                $emailMuted = in_array($recipient->id, $mutedEmailUserIds, true);

                if (! $inAppMuted && NotificationPreferences::wantsType($recipient, 'task_mentioned')) {
                    $piled = NotificationPiler::pile(
                        [
                            'user_id' => $recipient->id,
                            'type' => 'task_mentioned',
                            'causer_id' => Auth::id(),
                            'url' => $url,
                            'group_key' => "task:{$task->id}",
                        ],
                        "You were mentioned\n" . '**' . Auth::user()->name . '**' . " mentioned you on \"**{$task->title}**\"",
                        fn ($count) => "You were mentioned\nYou have **{$count}** new mentions on \"**{$task->title}**\""
                    );
                    $notification = $piled['notification'];

                    try {
                        broadcast(new TaskMentioned($comment, $recipient->id, $notification->id, $notification->pile_count, $piled['is_new']))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                if (! $emailMuted) {
                    NotificationMailer::send(
                        $recipient,
                        'task.mentioned',
                        Auth::user()->name . " mentioned you on \"{$task->title}\"",
                        ['**' . Auth::user()->name . '**' . " mentioned you in a comment on \"**{$task->title}**\":"],
                        url($url),
                        'View Task',
                        ['label' => 'Comment', 'content' => $preview]
                    );
                }
            }
        }

        return back();
    }
}