<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskDependencyController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('edit', $task);

        $validated = $request->validate([
            'depends_on_task_id' => 'required|integer|exists:tasks,id',
        ]);

        $dependsOnId = (int) $validated['depends_on_task_id'];

        if ($dependsOnId === $task->id) {
            return back()->withErrors(['error' => 'A task cannot depend on itself.']);
        }

        $dependsOnTask = Task::findOrFail($dependsOnId);

        if ($dependsOnTask->project_id !== $task->project_id) {
            return back()->withErrors(['error' => 'Dependencies must be within the same project.']);
        }

        if ($task->dependencies()->where('depends_on_task_id', $dependsOnId)->exists()) {
            return back()->withErrors(['error' => 'That dependency already exists.']);
        }

        if ($this->wouldCreateCycle($task, $dependsOnTask)) {
            return back()->withErrors(['error' => 'That would create a circular dependency.']);
        }

        $task->dependencies()->attach($dependsOnId);

        return back()->with('success', 'Dependency added.');
    }

    public function destroy(Task $task, Task $dependsOnTask)
    {
        $this->authorize('edit', $task);

        $task->dependencies()->detach($dependsOnTask->id);

        return back()->with('success', 'Dependency removed.');
    }

    /**
     * Would making $task depend on $newDependency create a cycle? True if $task is
     * already reachable by walking forward from $newDependency's own dependencies
     * (i.e. $newDependency, directly or transitively, depends on $task).
     */
    private function wouldCreateCycle(Task $task, Task $newDependency): bool
    {
        $visited = [];
        $queue = [$newDependency->id];

        while (! empty($queue)) {
            $currentId = array_shift($queue);

            if ($currentId === $task->id) {
                return true;
            }

            if (in_array($currentId, $visited, true)) {
                continue;
            }

            $visited[] = $currentId;

            $nextIds = Task::find($currentId)?->dependencies()->pluck('tasks.id')->all() ?? [];
            $queue = array_merge($queue, $nextIds);
        }

        return false;
    }
}
