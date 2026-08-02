<?php

namespace App\Http\Controllers;

use App\Events\TaskChanged;
use App\Events\TaskChecklistItemAdded;
use App\Models\ProjectNote;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TaskChecklistItemController extends Controller
{
    /**
     * Same project-wide "this task changed" signal TaskController uses for
     * every other task edit - a checklist item being added, checked/unchecked,
     * or removed is just as much a shared, everyone-sees-it change as a title
     * or status edit, so it needs to reach other viewers live too.
     */
    private function broadcastTaskChanged(Task $task): void
    {
        try {
            broadcast(TaskChanged::for($task))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Mirrors a checklist item's current done state and title into whichever
     * of the assignee's notes was copied from this task (see addToNotes below)
     * - the note-item counterpart of this same item, if one exists. There's at
     * most one such note per (task, assignee): addToNotes always finds-or-
     * creates rather than making a new one each time.
     */
    private function syncNoteItems(TaskChecklistItem $checklistItem, Task $task): void
    {
        $note = ProjectNote::where('task_id', $task->id)->where('user_id', $task->assigned_to)->first();

        if (! $note) {
            return;
        }

        $changed = false;
        $items = collect($note->content)->map(function ($item) use ($checklistItem, &$changed) {
            if (($item['checklist_item_id'] ?? null) === $checklistItem->id) {
                if ($item['done'] !== $checklistItem->done || $item['text'] !== $checklistItem->title) {
                    $item['done'] = $checklistItem->done;
                    $item['text'] = $checklistItem->title;
                    $changed = true;
                }
            }
            return $item;
        })->all();

        if ($changed) {
            $note->update(['content' => $items]);
        }
    }

    /**
     * A checklist item's note counterpart shouldn't outlive it as a dead
     * reference - unlink rather than delete, since removing an item from the
     * task checklist is an owner/manager/tester call, but removing it from the
     * assignee's personal notes is the assignee's alone. The text and done
     * state the note item already had are left exactly as they were; it just
     * stops being kept in sync with a checklist item that no longer exists.
     */
    private function unlinkNoteItems(TaskChecklistItem $checklistItem, Task $task): void
    {
        $note = ProjectNote::where('task_id', $task->id)->where('user_id', $task->assigned_to)->first();

        if (! $note) {
            return;
        }

        $changed = false;
        $items = collect($note->content)->map(function ($item) use ($checklistItem, &$changed) {
            if (($item['checklist_item_id'] ?? null) === $checklistItem->id) {
                $item['checklist_item_id'] = null;
                $changed = true;
            }
            return $item;
        })->all();

        if ($changed) {
            $note->update(['content' => $items]);
        }
    }

    /**
     * Tells the assignee a new checklist item was added to their task -
     * mirrors CommentController's per-recipient mute/preference/email pattern.
     * Skipped entirely when the person adding the item is the assignee
     * themselves (can't happen today, since manageChecklist excludes the
     * assignee role, but kept as a guard rather than relying on that) or when
     * the task currently has no assignee to tell.
     */
    private function notifyAssigneeOfNewItem(Task $task, TaskChecklistItem $item): void
    {
        if (! $task->assigned_to || (int) $task->assigned_to === (int) Auth::id()) {
            return;
        }

        $recipient = $task->assignee;
        if (! $recipient || ! $task->project->isMember($recipient)) {
            return;
        }

        $inAppMuted = $task->mutedBy()->wherePivot('mute_in_app', true)->where('users.id', $recipient->id)->exists()
            || $task->project->members()->wherePivot('mute_in_app', true)->where('users.id', $recipient->id)->exists();
        $emailMuted = $task->mutedBy()->wherePivot('mute_email', true)->where('users.id', $recipient->id)->exists()
            || $task->project->members()->wherePivot('mute_email', true)->where('users.id', $recipient->id)->exists();

        $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id . '&checklist=1';

        if (! $inAppMuted && NotificationPreferences::wantsType($recipient, 'task_checklist_item_added')) {
            $notification = UserNotification::create([
                'user_id' => $recipient->id,
                'type' => 'task_checklist_item_added',
                'message' => "New checklist item\n" . '**' . Auth::user()->name . '**' . " added \"{$item->title}\" to the checklist on \"**{$task->title}**\"",
                'url' => $url,
            ]);

            try {
                broadcast(new TaskChecklistItemAdded($item, $recipient->id, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        if (! $emailMuted) {
            NotificationMailer::send(
                $recipient,
                'task.checklist_item_added',
                Auth::user()->name . " added a checklist item to \"{$task->title}\"",
                ['**' . Auth::user()->name . '**' . " added a new checklist item to \"**{$task->title}**\": \"{$item->title}\""],
                url($url),
                'View Checklist'
            );
        }
    }

    public function store(Request $request, Task $task)
    {
        $this->authorize('manageChecklist', $task);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $position = $task->checklistItems()->max('position') + 1;

        $item = $task->checklistItems()->create([
            'title' => $validated['title'],
            'position' => $position,
            'created_by' => Auth::id(),
        ]);

        $this->broadcastTaskChanged($task);
        $this->notifyAssigneeOfNewItem($task, $item);

        return back()->with('success', 'Checklist item added.');
    }

    public function update(Request $request, TaskChecklistItem $checklistItem)
    {
        $task = $checklistItem->task;

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'done' => 'sometimes|boolean',
        ]);

        // Checking an item done/undone is the assignee's call alone - even an
        // owner or manager who can otherwise edit this task shouldn't get to
        // mark someone else's work complete (or reopen it) for them.
        if (array_key_exists('done', $validated)) {
            abort_unless($task->assigned_to === Auth::id(), 403);
        }

        // Any other field (currently just a title rename) is a structural edit
        // to the checklist, gated the same as adding/removing items - not the
        // assignee-inclusive 'update' check, since the assignee's only checklist
        // action is the 'done' toggle above.
        if (array_key_exists('title', $validated)) {
            $this->authorize('manageChecklist', $task);
        }

        $checklistItem->update($validated);

        if (array_key_exists('done', $validated) || array_key_exists('title', $validated)) {
            $this->syncNoteItems($checklistItem, $task);
        }

        $this->broadcastTaskChanged($task);

        return back()->with('success', 'Checklist item updated.');
    }

    public function destroy(TaskChecklistItem $checklistItem)
    {
        $task = $checklistItem->task;
        $this->authorize('manageChecklist', $task);

        // Owner/manager may remove any item. A tester (the only other role that
        // passes manageChecklist above) is limited to removing items they added
        // themselves - reviewing a task doesn't mean clearing out other people's
        // checklist entries. The assignee never reaches this far: they don't pass
        // manageChecklist at all, since their only checklist action is checking
        // items done/undone.
        $role = $task->project->roleFor(Auth::user());
        if (! in_array($role, ['owner', 'manager']) && $checklistItem->created_by !== Auth::id()) {
            abort(403, 'You can only remove checklist items you added yourself.');
        }

        $this->unlinkNoteItems($checklistItem, $task);

        $checklistItem->delete();

        $this->broadcastTaskChanged($task);

        return back()->with('success', 'Checklist item removed.');
    }

    /**
     * Copies a task checklist item into the assignee's My Notes, in a note
     * dedicated to this task (found-or-created, titled after it) so repeated
     * adds from the same task land in one place instead of scattering across
     * separate notes. The copied item carries a checklist_item_id link back to
     * this row, which is what keeps its done state mirrored in both
     * directions afterward - see syncNoteItems above and
     * ProjectNoteController::toggleItem for the note -> checklist direction.
     *
     * Assignee-only, same as checking the item done/undone: adding it to your
     * own notes is a personal bookmark, not a structural checklist edit.
     */
    public function addToNotes(TaskChecklistItem $checklistItem)
    {
        $task = $checklistItem->task;

        abort_unless($task->assigned_to === Auth::id(), 403);

        $note = ProjectNote::firstOrCreate(
            ['project_id' => $task->project_id, 'user_id' => Auth::id(), 'task_id' => $task->id],
            ['title' => Str::limit($task->title, 100, ''), 'content' => []]
        );

        $alreadyAdded = collect($note->content)
            ->contains(fn ($item) => ($item['checklist_item_id'] ?? null) === $checklistItem->id);

        if ($alreadyAdded) {
            return back()->with('success', 'Already in your notes.');
        }

        $items = $note->content;
        $items[] = [
            'id' => (string) Str::random(8),
            'text' => $checklistItem->title,
            'done' => $checklistItem->done,
            'checklist_item_id' => $checklistItem->id,
        ];
        $note->update(['content' => $items]);

        return back()->with('success', 'Added to My Notes.');
    }
}
