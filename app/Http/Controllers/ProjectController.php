<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Support\NotificationMailer;
use App\Support\Linkifier;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index()
    {
        $showArchived = request()->boolean('archived');

        $projects = Auth::user()->projects()
            ->with('owner')
            ->wherePivot('archived', $showArchived)
            ->withCount([
                'tasks',
                'tasks as done_tasks_count' => fn ($query) => $query->where('status', 'done'),
            ])
            ->get()
            ->sortByDesc(fn ($p) => $p->pivot->pinned)
            ->values();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'showingArchived' => $showArchived,
        ]);
    }

    public function archive(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['archived' => true]);
        return back()->with('success', 'Project archived.');
    }

    public function unarchive(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['archived' => false]);
        return back()->with('success', 'Project unarchived.');
    }

    public function create()
    {
        return Inertia::render('Projects/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Reverse any anchors from a previous save first, so strip_tags() (which doesn't
        // allow-list <a>) can't destroy a link that was already there — see Linkifier::unlinkify().
        $validated['description'] = Linkifier::unlinkify($validated['description'] ?? '');
        $validated['description'] = strip_tags($validated['description'], '<b><strong><i><em><u><span><br><p><div><ul><ol><li>');
        $validated['description'] = Linkifier::linkify($validated['description']);

        $project = Project::create([
            ...$validated,
            'owner_id' => Auth::id(),
        ]);

        $project->members()->attach(Auth::id(), ['role' => 'owner']);

        ProjectActivityLog::log($project, 'project_created');

        return redirect()->route('projects.show', $project)->with('success', 'Project created.');
    }

    public function show(Project $project)
    {
        $this->authorize('view', $project);

        $project->load([
            // withTrashed() so an owner who's mid-deletion (still inside the
            // grace period) doesn't just vanish from the member list — see
            // Project::owner() for the same reasoning.
            'members' => fn ($q) => $q->withTrashed(),
            'tasks.assignee',
            'tasks.comments.user',
            'tasks.deliverables',
            'tasks.checklistItems.creator:id,name',
            'tasks.dependencies:id,title,status',
            'tasks.dependents:id,title,status',
            'tasks.activityLogs' => fn ($q) => $q->with('user')->limit(20),
        ]);

        $pinnedTaskIds = Auth::user()->pinnedTasks()->pluck('tasks.id')->toArray();
        // Keyed by task id so each task's individual mute_in_app/mute_email pivot
        // flags are available below, not just whether a mute row exists at all.
        $mutedTasks = Auth::user()->mutedTasks()->get()->keyBy('id');
        $project->is_muted = $project->isMutedBy(Auth::user());
        $project->mute_in_app = $project->inAppMutedBy(Auth::user());
        $project->mute_email = $project->emailMutedBy(Auth::user());

        $role = $project->roleFor(Auth::user());
        $canViewAllHistory = in_array($role, ['owner', 'manager', 'tester']);

        $notes = $project->notes()->where('user_id', Auth::id())->latest()->get();

        // Which checklist items this person has already copied into My Notes -
        // lets the checklist UI show "In Notes" instead of "Add to Notes" for
        // ones already there, without a separate query per item. Only ever
        // relevant to a task's own assignee (the only role that can add an
        // item to notes - see TaskChecklistItemController::addToNotes), but
        // harmless to compute for everyone.
        $notedChecklistItemIds = $notes
            ->flatMap(fn ($note) => collect($note->content)->pluck('checklist_item_id'))
            ->filter()
            ->flip();

        // Pinned tasks always float to the top; within that, order by priority so the
        // most urgent work is visible first without the person having to sort manually.
        $priorityRank = ['high' => 0, 'medium' => 1, 'low' => 2];

        $sortedTasks = $project->tasks
            ->map(function ($task) use ($pinnedTaskIds, $mutedTasks, $canViewAllHistory, $notedChecklistItemIds) {
                $task->is_pinned = in_array($task->id, $pinnedTaskIds);
                $taskMute = $mutedTasks->get($task->id);
                $task->is_muted = (bool) $taskMute;
                $task->mute_in_app = (bool) $taskMute?->pivot->mute_in_app;
                $task->mute_email = (bool) $taskMute?->pivot->mute_email;

                // History can reveal feedback, reassignment, and other detail that isn't
                // any bystander's business — only the assignee living the task and the
                // owner/manager/tester who can act on it get to see it.
                $canViewHistory = $canViewAllHistory || $task->assigned_to === Auth::id();
                $task->can_view_history = $canViewHistory;

                if (! $canViewHistory) {
                    $task->setRelation('activityLogs', collect());
                }

                // Checklist visibility uses the same owner/manager/tester-or-assignee
                // set as history above (a tester reviewing the project can look, a
                // plain uninvolved member cannot); *acting* on it (adding/removing
                // items, or checking one done) is narrower still and enforced
                // separately in TaskChecklistItemController, not here.
                $canViewChecklist = $canViewHistory;
                $task->can_view_checklist = $canViewChecklist;

                if (! $canViewChecklist) {
                    $task->setRelation('checklistItems', collect());
                } else {
                    $task->checklistItems->each(function ($item) use ($notedChecklistItemIds) {
                        $item->in_my_notes = $notedChecklistItemIds->has($item->id);
                    });
                }

                return $task;
            })
            ->sortBy([
                fn ($a, $b) => $b->is_pinned <=> $a->is_pinned,
                fn ($a, $b) => ($priorityRank[$a->priority] ?? 1) <=> ($priorityRank[$b->priority] ?? 1),
            ])
            ->values();

        $project->setRelation('tasks', $sortedTasks);

        $pendingInvitations = $project->invitations()->where('status', 'pending')->with('invitedUser')->get();

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'role' => $role,
            'myNotes' => $notes,
            'pendingInvitations' => $pendingInvitations,
        ]);
    }

    public function edit(Project $project)
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', ['project' => $project]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Reverse any anchors from a previous save first, so strip_tags() (which doesn't
        // allow-list <a>) can't destroy a link that was already there — see Linkifier::unlinkify().
        $validated['description'] = Linkifier::unlinkify($validated['description'] ?? '');
        $validated['description'] = strip_tags($validated['description'], '<b><strong><i><em><u><span><br><p><div><ul><ol><li>');
        $validated['description'] = Linkifier::linkify($validated['description']);

        $changes = [];
        foreach (['name', 'description'] as $field) {
            if ($project->{$field} !== $validated[$field]) {
                $changes[$field] = ['old' => $project->{$field}, 'new' => $validated[$field]];
            }
        }

        $project->update($validated);

        if (! empty($changes)) {
            ProjectActivityLog::log($project, 'project_updated', ['changes' => $changes]);

            $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();
            foreach ($recipients as $recipient) {
                if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_updated')) {
                    $notification = \App\Models\UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'project_updated',
                        'message' => "Project updated\n\"**{$project->name}**\" was edited",
                        'url' => route('projects.show', $project->id, false),
                    ]);

                    try {
                        broadcast(new \App\Events\ProjectUpdated($recipient->id, $project, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }

                NotificationMailer::send(
                    $recipient,
                    'project.edited',
                    "{$project->name} was updated",
                    ["The project \"**{$project->name}**\" (#{$project->id}) you belong to has been updated."],
                    url(route('projects.show', $project->id, false)),
                    'View Project'
                );
            }
        }

        return redirect()->route('projects.show', $project)->with('success', 'Project updated.');
    }

    /**
     * Deleting a project no longer removes it immediately - it now only starts a
     * deletion request. The project is actually removed by confirmDeletion() once the
     * owner clicks the signed link mailed out below, so a stray click (or someone else
     * getting hold of the button) can't destroy a project outright.
     */
    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        if ($project->hasPendingDeletion()) {
            return back()->with('success', 'A deletion request is already pending confirmation by email.');
        }

        $project->update([
            'deletion_requested_at' => now(),
            'deletion_email_sent_at' => now(),
        ]);

        ProjectActivityLog::log($project, 'project_deletion_requested');

        $this->sendDeletionConfirmationEmail($project);

        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();

        foreach ($recipients as $recipient) {
            if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_deletion_requested')) {
                \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'project_deletion_requested',
                    'message' => "Deletion requested\n**" . Auth::user()->name . "** requested to delete \"**{$project->name}**\"",
                    'url' => route('projects.settings', $project->id, false),
                ]);
            }

            NotificationMailer::send(
                $recipient,
                'project.deletion_requested',
                "{$project->name} deletion requested",
                ["**" . Auth::user()->name . "** has requested to delete the project \"**{$project->name}**\" (#{$project->id}). It will be permanently removed once the owner confirms by email, unless cancelled first."],
                url(route('projects.settings', $project->id, false)),
                'View Project Settings'
            );
        }

        // One broadcast on the shared project channel, not one per recipient - anyone
        // currently viewing the project sees the pending state appear live.
        try {
            broadcast(new \App\Events\ProjectDeletionRequested($project->id, $project->name, Auth::user()->name))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Deletion requested. Check your email to confirm.');
    }

    /**
     * Re-sends the confirmation link for an already-pending deletion, gated by
     * Project::DELETION_EMAIL_COOLDOWN_SECONDS so the mail queue (and the owner's
     * inbox) can't be hammered by repeated clicks. The 'throttle' route middleware is
     * a second, coarser backstop against the same thing at the HTTP layer.
     */
    public function resendDeletionConfirmation(Project $project)
    {
        $this->authorize('delete', $project);

        if (! $project->hasPendingDeletion()) {
            return back()->with('success', 'There is no pending deletion to resend a confirmation for.');
        }

        $availableAt = $project->deletionEmailAvailableAt();
        if ($availableAt) {
            return back()->withErrors([
                'deletion_email' => 'Please wait ' . now()->diffInSeconds($availableAt) . ' more second(s) before resending.',
            ]);
        }

        $project->update(['deletion_email_sent_at' => now()]);

        $this->sendDeletionConfirmationEmail($project);

        return back()->with('success', 'Confirmation email resent.');
    }

    /**
     * Security-critical, like password-reset or email-verification mail: this must
     * reach the owner regardless of their notification preferences, so it's sent
     * directly rather than through NotificationMailer/EmailPreferences::wants().
     */
    private function sendDeletionConfirmationEmail(Project $project): void
    {
        $confirmUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'projects.deletion.confirm',
            now()->addHours(24),
            ['project' => $project->id]
        );

        try {
            \Illuminate\Support\Facades\Mail::to(Auth::user()->email)->queue(
                new \App\Mail\SynkroNotificationMail(
                    Auth::user()->name,
                    "Confirm deletion of {$project->name}",
                    [
                        "You requested to permanently delete the project \"**{$project->name}**\" (#{$project->id}). This cannot be undone once confirmed.",
                        'This link expires in 24 hours. If you didn\'t request this, open the project settings and cancel the pending deletion instead.',
                    ],
                    $confirmUrl,
                    'Confirm Deletion'
                )
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Reached only via the signed link mailed out by destroy() above - the 'signed'
     * route middleware rejects the request outright if the URL has been tampered with
     * or has expired, so no extra token comparison is needed here.
     */
    public function confirmDeletion(Project $project)
    {
        $this->authorize('delete', $project);

        if (! $project->hasPendingDeletion()) {
            return redirect()->route('projects.settings', $project)->with('success', 'There is no pending deletion to confirm.');
        }

        ProjectActivityLog::log($project, 'project_deleted');

        // Capture recipients, name, and id before delete() removes the project and its
        // project_user pivot rows - nothing here is queryable off $project afterwards.
        $projectName = $project->name;
        $projectId = $project->id;
        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();

        foreach ($recipients as $recipient) {
            if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_deleted')) {
                $notification = \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'project_deleted',
                    'message' => "Project deleted\n\"**{$projectName}**\" was deleted",
                    'url' => route('projects.index', [], false),
                ]);

                try {
                    broadcast(new \App\Events\ProjectDeleted($recipient->id, $projectName, $projectId, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $recipient,
                'project.deleted',
                "{$projectName} was deleted",
                ["The project \"**{$projectName}**\" (#{$projectId}) you were a member of has been deleted."],
            );
        }

        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }

    public function cancelDeletion(Project $project)
    {
        $this->authorize('delete', $project);

        if (! $project->hasPendingDeletion()) {
            return back()->with('success', 'There is no pending deletion to cancel.');
        }

        $project->update(['deletion_requested_at' => null, 'deletion_email_sent_at' => null]);

        ProjectActivityLog::log($project, 'project_deletion_cancelled');

        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();
        foreach ($recipients as $recipient) {
            NotificationMailer::send(
                $recipient,
                'project.deletion_requested',
                "{$project->name} deletion cancelled",
                ["The pending deletion of \"**{$project->name}**\" (#{$project->id}) was cancelled by **" . Auth::user()->name . '**.'],
                url(route('projects.show', $project->id, false)),
                'View Project'
            );
        }

        try {
            broadcast(new \App\Events\ProjectDeletionCancelled($project->id, $project->name))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        return back()->with('success', 'Deletion request cancelled.');
    }

    public function transferOwnership(Request $request, Project $project)
    {
        if ($project->owner_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if (! $project->members()->where('user_id', $validated['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'That user is not a member of this project.']);
        }

        $newOwner = \App\Models\User::find($validated['user_id']);

        $project->update(['owner_id' => $validated['user_id']]);
        $project->members()->updateExistingPivot($validated['user_id'], ['role' => 'owner']);
        $project->members()->updateExistingPivot(Auth::id(), ['role' => 'manager']);

        ProjectActivityLog::log($project, 'ownership_transferred', ['target_name' => $newOwner->name]);

        if (\App\Support\NotificationPreferences::wantsType($newOwner, 'project_ownership_transferred')) {
            $notification = \App\Models\UserNotification::create([
                'user_id' => $newOwner->id,
                'type' => 'project_ownership_transferred',
                'message' => "Ownership transferred\nYou now own \"**{$project->name}**\"",
                'url' => route('projects.show', $project->id, false),
            ]);

            try {
                broadcast(new \App\Events\ProjectOwnershipTransferred($newOwner->id, $project, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        NotificationMailer::send(
            $newOwner,
            'project.ownership_transferred',
            "You now own {$project->name}",
            ["Ownership of \"**{$project->name}**\" was transferred to you."],
            url(route('projects.show', $project->id, false)),
            'View Project'
        );

        return back()->with('success', 'Ownership transferred.');
    }

    public function settings(Project $project)
    {
        $role = $project->roleFor(Auth::user());

        if (! in_array($role, ['owner', 'manager'])) {
            abort(403);
        }

        $project->load(['members' => fn ($q) => $q->withTrashed()]);

        return Inertia::render('Projects/Settings', [
            'project' => $project,
            'role' => $role,
        ]);
    }
    public function pin(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['pinned' => true]);
        return back()->with('success', 'Project pinned.');
    }

    public function mute(Request $request, Project $project)
    {
        $validated = $request->validate([
            'scope' => 'required|in:in_app,email,both',
        ]);

        $project->members()->updateExistingPivot(Auth::id(), [
            'mute_in_app' => in_array($validated['scope'], ['in_app', 'both'], true),
            'mute_email' => in_array($validated['scope'], ['email', 'both'], true),
        ]);

        return back()->with('success', 'Notifications muted for this project.');
    }

    public function unmute(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['mute_in_app' => false, 'mute_email' => false]);
        return back()->with('success', 'Notifications unmuted for this project.');
    }

    public function deliverables(Project $project)
    {
        $this->authorize('view', $project);

        $tasks = $project->tasks()
            ->where('status', 'done')
            ->with('deliverables', 'assignee')
            ->orderBy('title')
            ->get();

        return Inertia::render('Projects/Deliverables', [
            'project' => $project,
            'tasks' => $tasks,
        ]);
    }

    public function downloadDeliverables(Project $project)
    {
        $this->authorize('view', $project);

        $tasks = $project->tasks()->where('status', 'done')->with('deliverables')->get();

        $files = $tasks->flatMap(fn ($task) => $task->deliverables
            ->where('type', 'file')
            ->map(fn ($d) => ['task' => $task, 'deliverable' => $d]));

        if ($files->isEmpty()) {
            return back()->withErrors(['error' => 'No files to download.']);
        }

        $entries = $files->map(function ($entry) {
            $folder = Str::slug($entry['task']->title) ?: 'task-' . $entry['task']->id;

            return [
                'path' => $entry['deliverable']->path,
                'name' => "{$folder}/{$entry['deliverable']->original_name}",
            ];
        })->all();

        return \App\Support\DeliverableZip::download($entries, Str::slug($project->name) . '-deliverables.zip');
    }

    public function unpin(Project $project)
    {
        $project->members()->updateExistingPivot(Auth::id(), ['pinned' => false]);
        return back()->with('success', 'Project unpinned.');
    }

    public function logs(Project $project)
    {
        $role = $project->roleFor(Auth::user());

        if (! in_array($role, ['owner', 'manager'])) {
            abort(403);
        }

        $logs = $project->activityLogs()->with('user')->get();

        return Inertia::render('Projects/Logs', [
            'project' => $project,
            'logs' => $logs,
        ]);
    }
}