<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;

class TaskChecklistItemController extends Controller
{
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

        return back()->with('success', 'Checklist item updated.');
    }

    public function destroy(TaskChecklistItem $checklistItem)
    {
        $this->authorize('update', $checklistItem->task);

        $checklistItem->delete();

        return back()->with('success', 'Checklist item removed.');
    }
}
