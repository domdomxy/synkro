<?php

namespace App\Http\Controllers;

use App\Events\CommentPosted;
use App\Events\TaskAssigned;
use App\Events\TaskDone;
use App\Events\TaskReviewed;
use App\Events\TaskReviewNeeded;
use App\Events\TaskUnassigned;
use App\Events\TaskUpdated;
use App\Models\Project;
use App\Models\ProjectActivityLog;
use App\Models\Task;
use App\Models\TaskDeliverable;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = Task::where('assigned_to', Auth::id())
            ->with('project')
            ->withCount('comments')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC')
            ->get();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('create', [Task::class, $project]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'due_date' => 'nullable|date',
        ]);

        $task = $project->tasks()->create($validated);

        ProjectActivityLog::log($project, 'task_created', ['task_title' => $task->title]);

        if ($task->assigned_to) {
            $assignee = $task->assignee;

            ProjectActivityLog::log($project, 'task_assigned', [
                'task_title' => $task->title,
                'target_name' => $assignee->name,
            ]);

            $notification = UserNotification::create([
                'user_id' => $task->assigned_to,
                'type' => 'task_assigned',
                'message' => "You were assigned a new task: \"{$task->title}\"",
                'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
            ]);

            try {
                broadcast(new TaskAssigned($task, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Task created.');
    }

    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        if (! empty($validated['assigned_to']) && ! $task->project->members()->where('user_id', $validated['assigned_to'])->exists()) {
            return back()->withErrors(['assigned_to' => 'That user is not a member of this project.']);
        }

        $previousAssignee = $task->assigned_to;
        $previousAssigneeName = $task->assignee?->name;
        $changes = [];

        foreach (['title', 'description', 'due_date'] as $field) {
            $old = $field === 'due_date' ? $task->due_date?->toDateTimeString() : $task->{$field};
            $new = $field === 'due_date' ? $validated['due_date'] : $validated[$field];

            if ((string) $old !== (string) $new) {
                $changes[$field] = ['old' => $old, 'new' => $new];
            }
        }

        $task->fill($validated);

        $assigneeChanged = $task->assigned_to !== $previousAssignee;
        $contentChanged = ! empty($changes);

        if ($assigneeChanged || $contentChanged) {
            $task->edited_at = now();
        }

        $task->save();

        if ($contentChanged) {
            ProjectActivityLog::log($task->project, 'task_updated', [
                'task_title' => $task->title,
                'changes' => $changes,
            ]);
        }

        if ($assigneeChanged) {
            if ($task->assigned_to) {
                $newAssignee = $task->assignee()->first();

                ProjectActivityLog::log($task->project, 'task_reassigned', [
                    'task_title' => $task->title,
                    'old_assignee' => $previousAssigneeName,
                    'new_assignee' => $newAssignee?->name,
                ]);

                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_assigned',
                    'message' => "You were assigned a task: \"{$task->title}\"",
                    'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
                ]);

                try {
                    broadcast(new TaskAssigned($task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            } else {
                ProjectActivityLog::log($task->project, 'task_unassigned', [
                    'task_title' => $task->title,
                    'old_assignee' => $previousAssigneeName,
                ]);
            }

            if ($previousAssignee && $previousAssignee !== $task->assigned_to) {
                $notification = UserNotification::create([
                    'user_id' => $previousAssignee,
                    'type' => 'task_unassigned',
                    'message' => "You were removed from task \"{$task->title}\"",
                    'url' => route('projects.show', $task->project_id, false),
                ]);

                try {
                    broadcast(new TaskUnassigned($previousAssignee, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        } elseif ($contentChanged && $task->assigned_to) {
            $notification = UserNotification::create([
                'user_id' => $task->assigned_to,
                'type' => 'task_updated',
                'message' => "Task \"{$task->title}\" was updated",
                'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
            ]);

            try {
                broadcast(new TaskUpdated($task->assigned_to, $task, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Task updated.');
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        ProjectActivityLog::log($task->project, 'task_deleted', ['task_title' => $task->title]);

        $task->delete();

        return back()->with('success', 'Task deleted.');
    }

    public function start(Task $task)
    {
        $this->authorize('update', $task);

        if ($task->status !== 'todo') {
            return back()->withErrors(['status' => 'This task has already been started.']);
        }

        $task->update(['status' => 'in_progress']);

        return back()->with('success', 'Task started.');
    }

    public function submit(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        if (! in_array($task->status, ['todo', 'in_progress', 'submitted'])) {
            return back()->withErrors(['status' => 'This task is not in a submittable state.']);
        }

        $validated = $request->validate([
            'files' => 'nullable|array',
            'files.*' => 'file|max:20480',
            'links' => 'nullable|array',
            'links.*' => 'url',
        ]);

        if (empty($validated['files']) && empty($validated['links'])) {
            return back()->withErrors(['files' => 'Add at least one file or link.']);
        }

        foreach ($request->file('files', []) as $file) {
            $task->deliverables()->create([
                'type' => 'file',
                'path' => $file->store('deliverables', 'public'),
                'original_name' => $file->getClientOriginalName(),
            ]);
        }

        foreach ($validated['links'] ?? [] as $link) {
            $task->deliverables()->create(['type' => 'link', 'url' => $link]);
        }

        $wasAlreadySubmitted = $task->status === 'submitted';

        $task->update([
            'status' => 'submitted',
            'submitted_at' => $task->submitted_at ?? now(),
        ]);

        if (! $wasAlreadySubmitted) {
            $testers = $task->project->members()->wherePivot('role', 'tester')->get();

            foreach ($testers as $tester) {
                $notification = UserNotification::create([
                    'user_id' => $tester->id,
                    'type' => 'task_review_needed',
                    'message' => "\"{$task->title}\" is waiting for your review",
                    'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
                ]);

                try {
                    broadcast(new TaskReviewNeeded($tester->id, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return back()->with('success', 'Task submitted.');
    }

    public function destroyDeliverable(TaskDeliverable $deliverable)
    {
        $task = $deliverable->task;

        $this->authorize('update', $task);

        if ($task->status !== 'submitted') {
            return back()->withErrors(['error' => 'Deliverables can only be edited while the task is submitted, before review begins.']);
        }

        if ($deliverable->type === 'file' && $deliverable->path) {
            Storage::disk('public')->delete($deliverable->path);
        }

        $deliverable->delete();

        return back()->with('success', 'Deliverable removed.');
    }

    public function startReview(Task $task)
    {
        $this->authorize('review', $task);

        if ($task->status !== 'submitted') {
            return back()->withErrors(['status' => 'This task is not awaiting review.']);
        }

        $task->update(['status' => 'in_review']);

        return back()->with('success', 'Review started.');
    }

    public function review(Request $request, Task $task)
    {
        $this->authorize('review', $task);

        if ($task->status !== 'in_review') {
            return back()->withErrors(['status' => 'This task is not currently under review.']);
        }

        $validated = $request->validate([
            'decision' => 'required|in:approve,reject',
            'feedback' => 'nullable|string|max:2000',
        ]);

        if ($validated['decision'] === 'reject' && empty($validated['feedback'])) {
            return back()->withErrors(['feedback' => 'Feedback is required when rejecting a submission.']);
        }

        if (! empty($validated['feedback'])) {
            $comment = $task->comments()->create([
                'user_id' => Auth::id(),
                'body' => $validated['feedback'],
                'is_feedback' => true,
            ]);

            try {
                broadcast(new CommentPosted($comment))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $task->update([
            'status' => $validated['decision'] === 'approve' ? 'done' : 'in_progress',
        ]);

        $decisionLabel = $validated['decision'] === 'approve' ? 'approved' : 'sent back for changes';
        $message = "\"{$task->title}\" was {$decisionLabel}" . (! empty($validated['feedback']) ? ": {$validated['feedback']}" : '');

        $notification = UserNotification::create([
            'user_id' => $task->assigned_to,
            'type' => $validated['decision'] === 'approve' ? 'task_approved' : 'task_rejected',
            'message' => $message,
            'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
        ]);

        try {
            broadcast(new TaskReviewed($task, $validated['decision'], $validated['feedback'] ?? null, $notification->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        if ($validated['decision'] === 'approve') {
            $recipients = $task->project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', Auth::id())
                ->get();

            foreach ($recipients as $recipient) {
                $doneNotification = UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'task_done',
                    'message' => "\"{$task->title}\" was marked done",
                    'url' => route('projects.show', $task->project_id, false) . '?task=' . $task->id,
                ]);

                try {
                    broadcast(new TaskDone($recipient->id, $task, $doneNotification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }

        return back()->with('success', $validated['decision'] === 'approve' ? 'Task approved.' : 'Task sent back for revisions.');
    }

    public function resolvePending(Request $request, Task $task)
    {
        $this->authorize('manageMembers', $task->project);

        if (! $task->pending_resolution) {
            return back()->withErrors(['error' => 'This task has nothing to resolve.']);
        }

        $validated = $request->validate([
            'action' => 'required|in:reset,keep',
        ]);

        if ($validated['action'] === 'reset') {
            $task->update([
                'assigned_to' => null,
                'status' => 'todo',
                'pending_resolution' => false,
            ]);

            ProjectActivityLog::log($task->project, 'submission_reset', ['task_title' => $task->title]);
        } else {
            $task->update(['pending_resolution' => false]);

            ProjectActivityLog::log($task->project, 'submission_kept', ['task_title' => $task->title]);
        }

        return back()->with('success', 'Resolved.');
    }
}