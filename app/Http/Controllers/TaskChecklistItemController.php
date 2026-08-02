<?php

namespace App\Http\Controllers;

use App\Events\TaskChanged;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

    public function store(Request $request, Task $task)
    {
        $this->authorize('manageChecklist', $task);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $position = $task->checklistItems()->max('position') + 1;

        $task->checklistItems()->create([
            'title' => $validated['title'],
            'position' => $position,
            'created_by' => Auth::id(),
        ]);

        $this->broadcastTaskChanged($task);

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

        $checklistItem->delete();

        $this->broadcastTaskChanged($task);

        return back()->with('success', 'Checklist item removed.');
    }
}
