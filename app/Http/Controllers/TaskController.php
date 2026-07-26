<?php
 
namespace App\Http\Controllers;
 
use App\Events\CommentPosted;
use App\Support\Linkifier;
use App\Events\TaskAssigned;
use App\Events\TaskDone;
use App\Events\TaskReviewed;
use App\Events\TaskReviewNeeded;
use App\Events\TaskUnassigned;
use App\Events\TaskUpdated;
use App\Events\TaskDeleted;
use App\Models\Project;
use App\Models\ProjectActivityLog;
use App\Models\Task;
use App\Models\TaskDeliverable;
use App\Models\UserNotification;
use App\Support\NoteFormatter;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
 
class TaskController extends Controller
{
    public function index()
    {
        $pinnedIds = Auth::user()->pinnedTasks()->pluck('tasks.id')->toArray();
 
        $tasks = Task::where('assigned_to', Auth::id())
            ->with('project')
            ->withCount('comments')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC')
            ->get()
            ->map(fn ($t) => tap($t, fn ($t) => $t->is_pinned = in_array($t->id, $pinnedIds)))
            ->sortByDesc('is_pinned')
            ->values();
 
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
            'priority' => 'nullable|in:low,medium,high',
            'dependencies' => 'nullable|array',
            'dependencies.*' => 'integer|exists:tasks,id',
        ]);

        $dependencyIds = $validated['dependencies'] ?? [];
        unset($validated['dependencies']);

        // Description comes from RichTextEditor (contenteditable), so it's an HTML string.
        // Allow-list matches ProjectController's project-description sanitization for consistency.
        // Reverse any anchors from a previous save first, so strip_tags() (which doesn't
        // allow-list <a>) can't destroy a link that was already there — see Linkifier::unlinkify().
        $validated['description'] = Linkifier::unlinkify($validated['description'] ?? '');
        $validated['description'] = strip_tags($validated['description'], '<b><strong><i><em><u><span><br><p><div>');
        $validated['description'] = Linkifier::linkify($validated['description']);

        $task = $project->tasks()->create($validated);

        if (! empty($dependencyIds)) {
            $validDependencyIds = $project->tasks()->whereIn('id', $dependencyIds)->pluck('id')->all();
            if (! empty($validDependencyIds)) {
                $task->dependencies()->attach($validDependencyIds);
            }
        }
 
        ProjectActivityLog::log($project, 'task_created', ['task_title' => $task->title], $task);
 
        if ($task->assigned_to) {
            $assignee = $task->assignee;
 
            ProjectActivityLog::log($project, 'task_assigned', [
                'task_title' => $task->title,
                'target_name' => $assignee->name,
            ], $task);
 
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
 
            if (NotificationPreferences::wantsType($assignee, 'task_assigned')) {
                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_assigned',
                    'message' => "Task assigned\nYou were assigned a new task: \"{$task->title}\"",
                    'url' => $url,
                ]);
 
                try {
                    broadcast(new TaskAssigned($task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
 
            NotificationMailer::send(
                $assignee,
                'task.assigned',
                "New task assigned: {$task->title}",
                ["You've been assigned a new task, \"{$task->title}\", in the project \"{$project->name}\" (ID {$project->id})."],
                url($url),
                'View Task'
            );
        }
 
        return back()->with('success', 'Task created.');
    }
 
    public function update(Request $request, Task $task)
    {
        $this->authorize('edit', $task);
 
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        // Same rich-text allow-list as store() above; keep both in sync if the editor's toolbar changes.
        // Reverse any anchors from a previous save first, so strip_tags() (which doesn't
        // allow-list <a>) can't destroy a link that was already there — see Linkifier::unlinkify().
        $validated['description'] = Linkifier::unlinkify($validated['description'] ?? '');
        $validated['description'] = strip_tags($validated['description'], '<b><strong><i><em><u><span><br><p><div>');
        $validated['description'] = Linkifier::linkify($validated['description']);
 
        $assignedToChanging = array_key_exists('assigned_to', $validated)
            && (string) ($validated['assigned_to'] ?? '') !== (string) ($task->assigned_to ?? '');

        if ($assignedToChanging && ! empty($validated['assigned_to']) && ! $task->project->members()->where('user_id', $validated['assigned_to'])->exists()) {
            return back()->withErrors(['assigned_to' => 'That user is not a member of this project.']);
        }
 
        $previousAssignee = $task->assigned_to;
        $previousAssigneeName = $task->assignee?->name;
        $changes = [];
 
        foreach (['title', 'description', 'due_date', 'priority'] as $field) {
            if ($field === 'due_date') {
                $old = $task->due_date?->toDateTimeString();
                $new = $validated['due_date'] ? \Illuminate\Support\Carbon::parse($validated['due_date'])->toDateTimeString() : null;
            } else {
                $old = $task->{$field};
                $new = $validated[$field] ?? $old;
            }

            if ((string) $old !== (string) $new) {
                $changes[$field] = ['old' => $old, 'new' => $new];
            }
        }
 
        $task->fill($validated);

        if (isset($changes['due_date'])) {
            $task->overdue_notified_at = null;
        }
 
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
            ], $task);
        }
 
        if ($assigneeChanged) {
            if ($task->assigned_to) {
                $newAssignee = $task->assignee()->first();
                $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
 
                ProjectActivityLog::log($task->project, 'task_reassigned', [
                    'task_title' => $task->title,
                    'old_assignee' => $previousAssigneeName,
                    'new_assignee' => $newAssignee?->name,
                ], $task);
 
                if (NotificationPreferences::wantsType($newAssignee, 'task_assigned')) {
                    $notification = UserNotification::create([
                        'user_id' => $task->assigned_to,
                        'type' => 'task_assigned',
                        'message' => "Task assigned\nYou were assigned a task: \"{$task->title}\"",
                        'url' => $url,
                    ]);

                    try {
                        broadcast(new TaskAssigned($task, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
 
                NotificationMailer::send(
                    $newAssignee,
                    'task.assigned',
                    "New task assigned: {$task->title}",
                    ["You've been assigned the task \"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id})."],
                    url($url),
                    'View Task'
                );
            } else {
                ProjectActivityLog::log($task->project, 'task_unassigned', [
                    'task_title' => $task->title,
                    'old_assignee' => $previousAssigneeName,
                ], $task);
            }
 
            if ($previousAssignee && $previousAssignee !== $task->assigned_to) {
                $projectUrl = route('projects.show', $task->project_id, false);
                $previousUser = \App\Models\User::find($previousAssignee);
                $previousUserStillMember = $previousUser && $task->project->isMember($previousUser);

                if ($previousUserStillMember && NotificationPreferences::wantsType($previousUser, 'task_unassigned')) {
                    $notification = UserNotification::create([
                        'user_id' => $previousAssignee,
                        'type' => 'task_unassigned',
                        'message' => "Removed from task\nYou were removed from task \"{$task->title}\"",
                        'url' => $projectUrl,
                    ]);

                    try {
                        broadcast(new TaskUnassigned($previousAssignee, $task, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                if ($previousUserStillMember) {
                    NotificationMailer::send(
                        $previousUser,
                        'task.unassigned',
                        "Removed from task: {$task->title}",
                        ["You've been unassigned from \"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id})."],
                        url($projectUrl),
                        'View Project'
                    );
                }
            }
        } elseif ($contentChanged && $task->assigned_to && $task->project->isMember($task->assignee)) {
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id . '&history=1';
 
            if (NotificationPreferences::wantsType($task->assignee, 'task_updated')) {
                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_updated',
                    'message' => "Task updated\n\"{$task->title}\" was updated",
                    'url' => $url,
                ]);
 
                try {
                    broadcast(new TaskUpdated($task->assigned_to, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
 
            NotificationMailer::send(
                $task->assignee,
                'task.updated',
                "Task updated: {$task->title}",
                ["The task \"{$task->title}\" you're assigned to was updated in \"{$task->project->name}\" (ID {$task->project_id})."],
                url($url),
                'View Task History'
            );
        }
 
        return back()->with('success', 'Task updated.');
    }
 
    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);
 
        ProjectActivityLog::log($task->project, 'task_deleted', ['task_title' => $task->title], $task);
 
        if ($task->assigned_to) {
            $assigneeId = $task->assigned_to;
            $assignee = $task->assignee;
            $taskTitle = $task->title;
            $projectName = $task->project->name;
            $projectId = $task->project_id;
            $projectUrl = route('projects.show', $projectId, false);
            $assigneeStillMember = $assignee && $task->project->isMember($assignee);
 
            $notification = null;
            if ($assigneeStillMember && NotificationPreferences::wantsType($assignee, 'task_deleted')) {
                try {
                    $notification = UserNotification::create([
                        'user_id' => $assigneeId,
                        'type' => 'task_deleted',
                        'message' => "Task deleted\n\"{$taskTitle}\" was deleted from {$projectName}.",
                        'url' => $projectUrl,
                    ]);
                } catch (\Throwable $e) {
                    report($e);
                }

                try {
                    broadcast(new TaskDeleted($assigneeId, $taskTitle, $projectName, $projectId, $notification?->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
 
            if ($assigneeStillMember) {
                NotificationMailer::send(
                    $assignee,
                    'task.deleted',
                    "Task deleted: {$taskTitle}",
                    ["The task \"{$taskTitle}\" you were assigned to was deleted from \"{$projectName}\" (ID {$projectId})."],
                    url($projectUrl),
                    'View Project'
                );
            }
        }
 
        $task->delete();
 
        return back()->with('success', 'Task deleted.');
    }

    /**
     * Multi-select bulk actions from the project task list. Owner/manager only (same
     * gate as the project's own "manage" permission) — this is a power-user tool for
     * whoever's running the project, not something an individual assignee needs.
     */
    public function bulkUpdate(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'task_ids' => 'required|array|min:1',
            'task_ids.*' => 'integer|exists:tasks,id',
            'action' => 'required|in:delete,status,priority,assign',
            'status' => 'nullable|in:todo,in_progress,submitted,in_review,done',
            'priority' => 'nullable|in:low,medium,high',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $tasks = $project->tasks()->whereIn('id', $validated['task_ids'])->get();

        if ($tasks->isEmpty()) {
            return back()->withErrors(['error' => 'No matching tasks found.']);
        }

        if ($validated['action'] === 'delete') {
            foreach ($tasks as $task) {
                $this->destroy($task);
            }

            return back()->with('success', count($tasks) . ' task(s) deleted.');
        }

        if ($validated['action'] === 'status') {
            if (empty($validated['status'])) {
                return back()->withErrors(['error' => 'Choose a status.']);
            }

            $affected = []; // assignee_id => [changed task titles]

            // Deliberately bypasses the normal start/submit/review workflow — this is a
            // manager override for administrative cleanup (e.g. closing out stale tasks),
            // not a substitute for the guided per-task flow.
            foreach ($tasks as $task) {
                if ($task->status === $validated['status']) {
                    continue;
                }

                $old = $task->status;
                $task->update(['status' => $validated['status']]);

                ProjectActivityLog::log($project, 'task_updated', [
                    'task_title' => $task->title,
                    'changes' => ['status' => ['old' => $old, 'new' => $validated['status']]],
                ], $task);

                if ($task->assigned_to && (int) $task->assigned_to !== Auth::id()) {
                    $affected[$task->assigned_to][] = $task->title;
                }
            }

            $this->notifyBulkFieldChange($project, $affected, 'status', $validated['status']);

            return back()->with('success', 'Status updated for ' . count($tasks) . ' task(s).');
        }

        if ($validated['action'] === 'priority') {
            if (empty($validated['priority'])) {
                return back()->withErrors(['error' => 'Choose a priority.']);
            }

            $affected = [];

            foreach ($tasks as $task) {
                if ($task->priority === $validated['priority']) {
                    continue;
                }

                $old = $task->priority;
                $task->update(['priority' => $validated['priority']]);

                ProjectActivityLog::log($project, 'task_updated', [
                    'task_title' => $task->title,
                    'changes' => ['priority' => ['old' => $old, 'new' => $validated['priority']]],
                ], $task);

                if ($task->assigned_to && (int) $task->assigned_to !== Auth::id()) {
                    $affected[$task->assigned_to][] = $task->title;
                }
            }

            $this->notifyBulkFieldChange($project, $affected, 'priority', $validated['priority']);

            return back()->with('success', 'Priority updated for ' . count($tasks) . ' task(s).');
        }

        if ($validated['action'] === 'assign') {
            $newAssigneeId = $validated['assigned_to'] ?? null;

            if ($newAssigneeId && ! $project->members()->where('user_id', $newAssigneeId)->exists()) {
                return back()->withErrors(['assigned_to' => 'That user is not a member of this project.']);
            }

            $changedCount = 0;
            $unassignedTitles = []; // previous_assignee_id => [task titles taken away]
            $newAssigneeTitles = []; // task titles newly assigned to $newAssigneeId
            // Fetched once, fresh, rather than reading $task->assignee after update() —
            // that property is a cached relation loaded (as null) when we read the *old*
            // assignee's name a few lines below, and Eloquent won't silently re-query it
            // just because assigned_to changed. Using the stale cache there was producing
            // a literal "null" in the reassigned-task log line.
            $newAssigneeName = $newAssigneeId ? \App\Models\User::find($newAssigneeId)?->name : null;

            foreach ($tasks as $task) {
                if ((string) $task->assigned_to === (string) $newAssigneeId) {
                    continue;
                }

                $oldAssigneeId = $task->assigned_to;
                $oldName = $task->assignee?->name;
                $taskTitle = $task->title;
                $task->update(['assigned_to' => $newAssigneeId]);
                $changedCount++;

                if ($newAssigneeId) {
                    ProjectActivityLog::log($project, 'task_reassigned', [
                        'task_title' => $taskTitle,
                        'old_assignee' => $oldName,
                        'new_assignee' => $newAssigneeName,
                    ], $task);

                    $newAssigneeTitles[] = $taskTitle;
                } else {
                    ProjectActivityLog::log($project, 'task_unassigned', [
                        'task_title' => $taskTitle,
                        'old_assignee' => $oldName,
                    ], $task);
                }

                if ($oldAssigneeId && (int) $oldAssigneeId !== (int) ($newAssigneeId ?? 0) && (int) $oldAssigneeId !== Auth::id()) {
                    $unassignedTitles[$oldAssigneeId][] = $taskTitle;
                }
            }

            // Let anyone who lost tasks in this bulk move know, same grouped-per-person
            // approach as the "newly assigned" notification just below.
            foreach ($unassignedTitles as $userId => $titles) {
                $previousUser = \App\Models\User::find($userId);

                if (! $previousUser || ! $project->isMember($previousUser)) {
                    continue;
                }

                $url = route('projects.show', $project->id, false);
                $count = count($titles);
                $summary = $count > 1 ? "{$count} tasks were reassigned away from you" : '1 task was reassigned away from you';
                $taskList = collect($titles)->map(fn ($t) => "**{$t}**")->implode("\n");

                if (NotificationPreferences::wantsType($previousUser, 'task_unassigned')) {
                    UserNotification::create([
                        'user_id' => $previousUser->id,
                        'type' => 'task_unassigned',
                        'message' => "Tasks reassigned\n{$taskList}",
                        'url' => $url,
                    ]);
                }

                NotificationMailer::send(
                    $previousUser,
                    'task.unassigned',
                    "{$summary} in {$project->name}",
                    ["{$summary} in \"{$project->name}\" (ID {$project->id})."],
                    url($url),
                    'View Project',
                    ['label' => $count > 1 ? 'Tasks' : 'Task', 'html' => true, 'content' => NoteFormatter::toHtml($taskList)]
                );
            }

            // One grouped notification rather than one per task (bulk-assigning 20 tasks
            // shouldn't fire 20 separate pings). Stored so it shows up in the bell on the
            // next page load; intentionally skips the live websocket push that individual
            // task events use, since there's no clean single-task payload for a "N tasks"
            // notification.
            if ($newAssigneeId && $changedCount > 0) {
                $assignee = \App\Models\User::find($newAssigneeId);

                if ($assignee) {
                    $url = route('projects.show', $project->id, false);
                    $taskList = collect($newAssigneeTitles)->map(fn ($t) => "**{$t}**")->implode("\n");
                    $summary = $changedCount > 1 ? "You were assigned {$changedCount} tasks" : 'You were assigned 1 task';

                    if (NotificationPreferences::wantsType($assignee, 'task_assigned')) {
                        UserNotification::create([
                            'user_id' => $assignee->id,
                            'type' => 'task_assigned',
                            'message' => "Tasks assigned\n{$taskList}",
                            'url' => $url,
                        ]);
                    }

                    NotificationMailer::send(
                        $assignee,
                        'task.assigned',
                        "{$changedCount} new task(s) assigned in {$project->name}",
                        ["{$summary} in \"{$project->name}\" (ID {$project->id})."],
                        url($url),
                        'View Project',
                        ['label' => $changedCount > 1 ? 'Tasks' : 'Task', 'html' => true, 'content' => NoteFormatter::toHtml($taskList)]
                    );
                }
            }

            return back()->with('success', 'Assignee updated for ' . $changedCount . ' task(s).');
        }
    }

    /**
     * Sends one grouped in-app + email notification per assignee affected by a bulk
     * status/priority change, listing the actual task titles (not just a count) —
     * mirrors the "N task(s)" grouping used for bulk reassignment above, so a manager
     * updating 20 tasks still gets one ping per person, just with the task names
     * attached. Intentionally skips the live websocket push (no clean single-task
     * payload for a grouped "N tasks" event), same as bulk assign.
     *
     * @param array<int,array<string>> $affectedTitles assignee_id => [changed task titles]
     */
    private function notifyBulkFieldChange(Project $project, array $affectedTitles, string $field, string $newValue): void
    {
        if (empty($affectedTitles)) {
            return;
        }

        $label = ucwords(str_replace('_', ' ', $newValue));
        $fieldLabel = $field === 'status' ? 'Status' : 'Priority';
        $headline = "{$fieldLabel} changed to {$label}";

        foreach ($affectedTitles as $userId => $titles) {
            $user = \App\Models\User::find($userId);

            if (! $user || ! $project->isMember($user)) {
                continue;
            }

            $url = route('projects.show', $project->id, false);
            $count = count($titles);
            $summary = $count > 1
                ? "{$count} of your tasks had their {$field} changed to {$label}"
                : "1 of your tasks had its {$field} changed to {$label}";
            $taskList = collect($titles)->map(fn ($t) => "**{$t}**")->implode("\n");

            if (NotificationPreferences::wantsType($user, 'task_updated')) {
                UserNotification::create([
                    'user_id' => $user->id,
                    'type' => 'task_updated',
                    'message' => "{$headline}\n{$taskList}",
                    'url' => $url,
                ]);
            }

            NotificationMailer::send(
                $user,
                'task.updated',
                "{$headline} in {$project->name}",
                ["{$summary} in \"{$project->name}\" (ID {$project->id})."],
                url($url),
                'View Project',
                ['label' => $count > 1 ? 'Tasks' : 'Task', 'html' => true, 'content' => NoteFormatter::toHtml($taskList)]
            );
        }
    }
 
    public function start(Task $task)
    {
        $this->authorize('update', $task);
 
        if ($task->status !== 'todo') {
            return back()->withErrors(['status' => 'This task has already been started.']);
        }
 
        $blockingTitles = $task->dependencies()->where('status', '!=', 'done')->pluck('title');
 
        if ($blockingTitles->isNotEmpty()) {
            return back()->withErrors(['status' => 'This task is blocked by: ' . $blockingTitles->implode(', ')]);
        }
 
        $task->update(['status' => 'in_progress']);
 
        ProjectActivityLog::log($task->project, 'task_started', ['task_title' => $task->title], $task);

        if ($task->assigned_to && $task->assigned_to !== Auth::id() && $task->project->isMember($task->assignee)) {
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

            if (NotificationPreferences::wantsType($task->assignee, 'task_updated')) {
                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_updated',
                    'message' => "Task started\n\"{$task->title}\" was moved to In Progress",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskUpdated($task->assigned_to, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }
 
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
            'files.*' => 'file|max:51200', // see #8 below for the raised limit
            'links' => 'nullable|array',
            'links.*' => 'url',
        ], [
            'files.*.max' => 'One or more files exceed the 50MB size limit and were not uploaded.',
        ]);
 
        if (empty($validated['files']) && empty($validated['links'])) {
            return back()->withErrors(['files' => 'Add at least one file or link.']);
        }
 
        foreach ($request->file('files', []) as $file) {
            $task->deliverables()->create([
                'type' => 'file',
                'path' => $file->store('deliverables', 'public'),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
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
            $testers = $task->project->members()->wherePivot('role', 'tester')->where('users.id', '!=', Auth::id())->get();

            $reviewers = $testers->isNotEmpty()
                ? $testers
                : $task->project->members()->wherePivotIn('role', ['owner', 'manager'])->where('users.id', '!=', Auth::id())->get();

            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

            foreach ($reviewers as $reviewer) {
                if (NotificationPreferences::wantsType($reviewer, 'task_review_needed')) {
                    $notification = UserNotification::create([
                        'user_id' => $reviewer->id,
                        'type' => 'task_review_needed',
                        'message' => "Review needed\n\"{$task->title}\" is waiting for your review",
                        'url' => $url,
                    ]);

                    try {
                        broadcast(new TaskReviewNeeded($reviewer->id, $task, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $reviewer,
                    'task.review_needed',
                    "Review needed: {$task->title}",
                    ["\"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id}) has been submitted and is waiting for your review."],
                    url($url),
                    'Review Now'
                );
            }
        }
 
        return back()->with('success', 'Task submitted.');
    }
 
    public function destroyDeliverable(TaskDeliverable $deliverable)
    {
        $task = $deliverable->task;
 
        $this->authorize('update', $task);
 
        if (! in_array($task->status, ['in_progress', 'submitted'])) {
            return back()->withErrors(['error' => 'Deliverables can only be edited while the task is in progress or submitted, before review begins.']);
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
 
        ProjectActivityLog::log($task->project, 'task_review_started', ['task_title' => $task->title], $task);

        if ($task->assigned_to && $task->assigned_to !== Auth::id() && $task->project->isMember($task->assignee)) {
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;

            if (NotificationPreferences::wantsType($task->assignee, 'task_updated')) {
                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_updated',
                    'message' => "Under review\n\"{$task->title}\" is now being reviewed",
                    'url' => $url,
                ]);

                try {
                    broadcast(new TaskUpdated($task->assigned_to, $task, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }
 
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
                'is_rejection' => $validated['decision'] === 'reject',
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
 
        ProjectActivityLog::log(
            $task->project,
            $validated['decision'] === 'approve' ? 'task_approved' : 'task_rejected',
            ['task_title' => $task->title],
            $task
        );

        $decisionLabel = $validated['decision'] === 'approve' ? 'approved' : 'sent back for changes';
        $decisionTitle = $validated['decision'] === 'approve' ? 'Task approved' : 'Changes requested';
        $message = "{$decisionTitle}\n\"{$task->title}\" was {$decisionLabel}" . (! empty($validated['feedback']) ? ": {$validated['feedback']}" : '');
        $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
 
        $decisionType = $validated['decision'] === 'approve' ? 'task_approved' : 'task_rejected';

        // A task assigned to a member who has since been removed/left stays assigned (frozen for
        // review, not unassigned) so its history is preserved — but that person shouldn't be
        // notified or emailed about a review decision on a project they're no longer part of.
        $assigneeStillMember = $task->assignee && $task->project->isMember($task->assignee);

        if ($assigneeStillMember && NotificationPreferences::wantsType($task->assignee, $decisionType)) {
            $notification = UserNotification::create([
                'user_id' => $task->assigned_to,
                'type' => $decisionType,
                'message' => $message,
                'url' => $url,
            ]);

            try {
                broadcast(new TaskReviewed($task, $validated['decision'], $validated['feedback'] ?? null, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }
 
        if ($assigneeStillMember) {
            $mailLines = ["\"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id}) was {$decisionLabel}."];
            if (! empty($validated['feedback'])) {
                $mailLines[] = "Feedback: {$validated['feedback']}";
            }
 
            NotificationMailer::send(
                $task->assignee,
                $validated['decision'] === 'approve' ? 'task.approved' : 'task.rejected',
                $validated['decision'] === 'approve' ? "Approved: {$task->title}" : "Changes requested: {$task->title}",
                $mailLines,
                url($url),
                'View Task'
            );
        }
 
        if ($validated['decision'] === 'approve') {
            $recipients = $task->project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', Auth::id())
                ->get();
 
            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'task_done')) {
                    $doneNotification = UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'task_done',
                        'message' => "Task completed\n\"{$task->title}\" was marked done",
                        'url' => $url,
                    ]);

                    try {
                        broadcast(new TaskDone($recipient->id, $task, $doneNotification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $recipient,
                    'task.done',
                    "Task completed: {$task->title}",
                    ["\"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id}) was marked done."],
                    url($url),
                    'View Task'
                );
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
            foreach ($task->deliverables as $deliverable) {
                if ($deliverable->type === 'file' && $deliverable->path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($deliverable->path);
                }
            }
            $task->deliverables()->delete();
 
            $task->update([
                'assigned_to' => null,
                'status' => 'todo',
                'pending_resolution' => false,
                'submitted_at' => null,
            ]);
 
            ProjectActivityLog::log($task->project, 'submission_reset', ['task_title' => $task->title], $task);
        } else {
            $task->update(['pending_resolution' => false]);
            ProjectActivityLog::log($task->project, 'submission_kept', ['task_title' => $task->title], $task);
        }
        return redirect()->route('projects.show', [
            'project' => $task->project_id,
            '_r' => now()->timestamp,
        ])->with('success', 'Resolved.');
    }
    public function pin(Task $task)
    {
        Auth::user()->pinnedTasks()->syncWithoutDetaching([$task->id]);
        return back()->with('success', 'Task pinned.');
    }
 
    public function unpin(Task $task)
    {
        Auth::user()->pinnedTasks()->detach($task->id);
        return back()->with('success', 'Task unpinned.');
    }
    public function reopen(Request $request, Task $task)
    {
        $this->authorize('manageMembers', $task->project); // was: $this->authorize('review', $task);
 
        if ($task->status !== 'done') {
            return back()->withErrors(['status' => 'Only completed tasks can be sent back for changes.']);
        }
 
        $validated = $request->validate([
            'feedback' => 'required|string|max:2000',
        ]);
 
        $comment = $task->comments()->create([
            'user_id' => Auth::id(),
            'body' => $validated['feedback'],
            'is_feedback' => true,
            'is_reopened' => true,
        ]);
 
        try {
            broadcast(new CommentPosted($comment))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }
 
        $task->update(['status' => 'in_progress']);
 
        ProjectActivityLog::log($task->project, 'task_reopened', ['task_title' => $task->title], $task);
 
        // Same reasoning as review(): a frozen task stays assigned to a removed/left member for
        // history's sake, but they shouldn't hear about it being reopened on a project they've left.
        if ($task->assignee && $task->project->isMember($task->assignee)) {
            $url = route('projects.show', $task->project_id, false) . '?task=' . $task->id;
 
            if (NotificationPreferences::wantsType($task->assignee, 'task_reopened')) {
                $notification = UserNotification::create([
                    'user_id' => $task->assigned_to,
                    'type' => 'task_reopened',
                    'message' => "Task reopened\n\"{$task->title}\" was reopened for changes: {$validated['feedback']}",
                    'url' => $url,
                ]);

                try {
                    broadcast(new \App\Events\TaskReopened($task->assigned_to, $task, $validated['feedback'], $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
 
            NotificationMailer::send(
                $task->assignee,
                'task.reopened',
                "Changes requested: {$task->title}",
                ["\"{$task->title}\" in \"{$task->project->name}\" (ID {$task->project_id}) was reopened for changes.", "Feedback: {$validated['feedback']}"],
                url($url),
                'View Task'
            );
        }
 
        return back()->with('success', 'Task sent back for changes.');
    }
    public function downloadDeliverables(Task $task)
    {
        $this->authorize('view', $task->project);
 
        $files = $task->deliverables()->where('type', 'file')->get();
 
        if ($files->isEmpty()) {
            return back()->withErrors(['error' => 'No files to download.']);
        }
 
        $entries = $files->map(fn ($file) => [
            'path' => $file->path,
            'name' => $file->original_name,
        ])->all();
 
        return \App\Support\DeliverableZip::download($entries, Str::slug($task->title) . '-deliverables.zip');
    }
}