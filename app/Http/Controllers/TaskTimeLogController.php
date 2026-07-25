<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskTimeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskTimeLogController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'hours' => 'required|numeric|min:0.1|max:999',
            'note' => 'nullable|string|max:255',
            'logged_date' => 'nullable|date',
        ]);

        $task->timeLogs()->create([
            'user_id' => Auth::id(),
            'hours' => $validated['hours'],
            'note' => $validated['note'] ?? null,
            'logged_date' => $validated['logged_date'] ?? now()->toDateString(),
        ]);

        return back()->with('success', 'Time logged.');
    }

    public function destroy(TaskTimeLog $timeLog)
    {
        $task = $timeLog->task;
        $role = $task->project->roleFor(Auth::user());
        $canManage = in_array($role, ['owner', 'manager']);

        if (! $canManage && $timeLog->user_id !== Auth::id()) {
            abort(403);
        }

        $timeLog->delete();

        return back()->with('success', 'Time entry removed.');
    }
}
