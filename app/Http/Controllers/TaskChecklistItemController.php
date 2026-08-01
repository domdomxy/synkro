<?php

namespace App\Http\Controllers;

use App\Events\TaskChanged;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;

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
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $position = $task->checklistItems()->max('position') + 1;

        $task->checklistItems()->create([
            'title' => $validated['title'],
            'position' => $position,
        ]);

        $this->broadcastTaskChanged($task);

        return back()->with('success', 'Checklist item added.');
    }

    public function update(Request $request, TaskChecklistItem $checklistItem)
    {
        $this->authorize('update', $checklistItem->task);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'done' => 'sometimes|boolean',
        ]);

        $checklistItem->update($validated);

        $this->broadcastTaskChanged($checklistItem->task);

        return back()->with('success', 'Checklist item updated.');
    }

    public function destroy(TaskChecklistItem $checklistItem)
    {
        $this->authorize('update', $checklistItem->task);

        $task = $checklistItem->task;

        $checklistItem->delete();

        $this->broadcastTaskChanged($task);

        return back()->with('success', 'Checklist item removed.');
    }
}
