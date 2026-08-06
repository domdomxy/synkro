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
        // allow-list <a>) can't destroy a link that was already there - see Linkifier::unlinkify().
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

        // A trashed project's own tasks were cascade-trashed alongside it (see
        // Project::booted()) - without withTrashed() here they'd load as an empty
        // list, defeating the point of a member being able to open a project
        // during its grace period to collect what they need before it's gone.
        $trashed = $project->trashed();

        $project->load([
            // withTrashed() so an owner who's mid-deletion (still inside the
            // grace period) doesn't just vanish from the member list - see
            // Project::owner() for the same reasoning.
            'members' => fn ($q) => $q->withTrashed(),
            'tasks' => fn ($q) => $trashed ? $q->withTrashed() : $q,
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
        // Only meaningful (non-null) while the project is actually trashed - lets
        // the read-only banner tell a member exactly when it'll be gone for good.
        $project->grace_ends_at = $project->deletionGraceEndsAt();
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
                // any bystander's business - only the assignee living the task and the
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
        // allow-list <a>) can't destroy a link that was already there - see Linkifier::unlinkify().
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
                        'causer_id' => Auth::id(),
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

        $this->requestDeletion($project);
        $this->sendDeletionConfirmationEmail($project);

        return back()->with('success', 'Deletion requested. Check your email to confirm.');
    }

    /**
     * Marks a project pending deletion and notifies its other members - everything
     * destroy() above used to do except sending the owner's own confirmation email,
     * split out so a caller acting on several projects at once (see TrashController::
     * deleteExisting()) can run this per project but send just one combined
     * confirmation email for the whole batch instead of one per project.
     */
    public function requestDeletion(Project $project): void
    {
        $project->update([
            'deletion_requested_at' => now(),
            'deletion_email_sent_at' => now(),
        ]);

        ProjectActivityLog::log($project, 'project_deletion_requested');

        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();

        foreach ($recipients as $recipient) {
            if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_deletion_requested')) {
                $notification = \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'project_deletion_requested',
                    'causer_id' => Auth::id(),
                    'message' => "Deletion requested\n**" . Auth::user()->name . "** requested to delete \"**{$project->name}**\"",
                    // projects.show, not projects.settings: settings is owner/manager-only,
                    // and this notification goes out to every member. The pending-deletion
                    // banner is shown on the project page too, which any member can open.
                    'url' => route('projects.show', $project->id, false),
                ]);

                try {
                    broadcast(new \App\Events\ProjectDeletionRequestedNotification(
                        $recipient->id,
                        $project->id,
                        $project->name,
                        Auth::user()->name,
                        $notification->id
                    ))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $recipient,
                'project.deletion_requested',
                "{$project->name} deletion requested",
                ["**" . Auth::user()->name . "** has requested to delete the project \"**{$project->name}**\" (#{$project->id}). It will move to trash once the owner confirms by email, unless cancelled first."],
                url(route('projects.show', $project->id, false)),
                'View Project'
            );
        }

        // One broadcast on the shared project channel, not one per recipient - anyone
        // currently viewing the project sees the pending state appear live.
        try {
            broadcast(new \App\Events\ProjectDeletionRequested($project->id, $project->name, Auth::user()->name))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }
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
    public function sendDeletionConfirmationEmail(Project $project): void
    {
        $confirmUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'projects.deletion.confirm',
            now()->addHours(24),
            ['project' => $project->id]
        );

        $graceDays = (int) config('synkro.project_deletion_grace_days', 7);

        try {
            \Illuminate\Support\Facades\Mail::to(Auth::user()->email)->queue(
                new \App\Mail\SynkroNotificationMail(
                    Auth::user()->name,
                    "Confirm deletion of {$project->name}",
                    [
                        "You requested to delete the project \"**{$project->name}**\" (#{$project->id}). Confirming moves it to trash, where you'll have {$graceDays} day(s) to restore it before it's gone for good.",
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
     * One email, one confirm click, for every project passed in - used instead of
     * sendDeletionConfirmationEmail() (which is one email per project) when several
     * projects were requested for deletion together from the Trash page's "delete
     * from here" picker (see TrashController::deleteExisting()), so selecting, say,
     * 3 projects doesn't mean digging 3 separate confirmation emails out of an
     * inbox. Same security posture as the single-project version: signed, 24-hour
     * link, sent directly regardless of email notification preferences.
     */
    public function sendDeletionConfirmationEmailBatch(\Illuminate\Support\Collection $projects): void
    {
        $confirmUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'projects.deletion.confirmBatch',
            now()->addHours(24),
            ['projects' => $projects->pluck('id')->implode(',')]
        );

        $graceDays = (int) config('synkro.project_deletion_grace_days', 7);
        $names = $projects->pluck('name')->map(fn ($name) => "\"**{$name}**\"")->implode(', ');

        try {
            \Illuminate\Support\Facades\Mail::to(Auth::user()->email)->queue(
                new \App\Mail\SynkroNotificationMail(
                    Auth::user()->name,
                    $projects->count() === 1 ? "Confirm deletion of {$projects->first()->name}" : 'Confirm deletion of ' . $projects->count() . ' projects',
                    [
                        "You requested to delete {$names}. Confirming moves all of them to trash at once, where you'll have {$graceDays} day(s) to restore each before it's gone for good.",
                        'This link expires in 24 hours. If you didn\'t request this, open the trash page and cancel the pending deletion(s) instead.',
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
     * or has expired, so no extra token comparison is needed here. $project->delete()
     * below soft-deletes (Project uses SoftDeletes) rather than removing the row, so
     * this moves the project into the trash - see Project::booted() for how its tasks
     * are trashed alongside it, and projects:purge-deleted for when it's actually gone.
     */
    public function confirmDeletion(Project $project)
    {
        $this->authorize('delete', $project);

        if (! $project->hasPendingDeletion()) {
            return redirect()->route('projects.settings', $project)->with('success', 'There is no pending deletion to confirm.');
        }

        $graceDays = $this->finalizeDeletion($project);

        return redirect()->route('projects.index')->with('success', "Project moved to trash. It'll be permanently deleted in {$graceDays} day(s) unless restored.");
    }

    /**
     * Confirms every project in a batch at once - reached from the single signed
     * link sendDeletionConfirmationEmailBatch() mails out when several projects
     * were selected together from the Trash page's "delete from here" picker
     * (see TrashController::deleteExisting()), instead of the owner needing to
     * click a separate email for each one. Shares finalizeDeletion() with the
     * single-project confirmDeletion() above so the trash/notify/broadcast side
     * effects stay in exactly one place.
     *
     * A project that's no longer pending by the time this is opened (deletion
     * cancelled, link re-used after expiry-adjacent edge cases, etc.) is silently
     * skipped rather than failing the whole batch.
     */
    public function confirmDeletionBatch(Request $request)
    {
        $projectIds = array_filter(array_map('intval', explode(',', (string) $request->query('projects', ''))));

        $confirmed = 0;
        $skipped = 0;
        $graceDays = (int) config('synkro.project_deletion_grace_days', 7);

        foreach (Project::whereIn('id', $projectIds)->get() as $project) {
            if (! Auth::user()->can('delete', $project) || ! $project->hasPendingDeletion()) {
                $skipped++;
                continue;
            }

            $graceDays = $this->finalizeDeletion($project);
            $confirmed++;
        }

        if ($confirmed === 0) {
            return redirect()->route('settings.edit', ['section' => 'trash'])->with('success', 'Nothing left to confirm - those deletion request(s) may have already been actioned or cancelled.');
        }

        $message = ($confirmed === 1 ? '1 project' : "{$confirmed} projects") . " moved to trash. It'll be permanently deleted in {$graceDays} day(s) unless restored.";
        if ($skipped > 0) {
            $message .= " {$skipped} skipped.";
        }

        return redirect()->route('settings.edit', ['section' => 'trash'])->with('success', $message);
    }

    /**
     * The actual trash-and-notify work shared by confirmDeletion() and
     * confirmDeletionBatch() - logs the deletion, notifies every other member,
     * and soft-deletes the project. Caller is responsible for the pending-deletion
     * and authorization checks beforehand. Returns the configured grace period in
     * days, purely so callers can include it in their own response message
     * without a second config() lookup.
     */
    private function finalizeDeletion(Project $project): int
    {
        ProjectActivityLog::log($project, 'project_deleted');

        // Capture recipients and name before delete() soft-deletes the project -
        // members() still resolves fine afterwards (the pivot rows are untouched),
        // but grabbing them up front keeps this in line with the rest of the method.
        $projectName = $project->name;
        $projectId = $project->id;
        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();
        $graceDays = (int) config('synkro.project_deletion_grace_days', 7);

        foreach ($recipients as $recipient) {
            if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_deleted')) {
                $notification = \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'project_deleted',
                    'causer_id' => Auth::id(),
                    'message' => "Project deleted\n\"**{$projectName}**\" was deleted",
                    'url' => route('projects.show', $projectId, false),
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
                [
                    "The project \"**{$projectName}**\" (#{$projectId}) you were a member of has been deleted.",
                    "It's still viewable for {$graceDays} more day(s) while it sits in the trash - open it to grab anything you need before it's gone for good.",
                ],
                url(route('projects.show', $projectId, false)),
                'View Project'
            );
        }

        $project->delete();

        return $graceDays;
    }

    /** Restores a trashed project (and, via Project::booted(), the tasks that were trashed alongside it). */
    public function restore(Project $project)
    {
        $this->authorize('restore', $project);

        if (! $project->trashed()) {
            return back()->with('success', 'That project is not in the trash.');
        }

        $project->restore();

        // The pending-deletion flag (set by destroy(), only cleared normally by
        // cancelDeletion()) survives the soft-delete/trash round-trip untouched -
        // without clearing it here, a project deleted via the email-confirmation
        // flow comes back from the trash still showing the "pending deletion,
        // check your email" banner on its page, with no real pending request
        // behind it anymore.
        $project->update(['deletion_requested_at' => null, 'deletion_email_sent_at' => null]);

        ProjectActivityLog::log($project, 'project_restored');

        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();
        foreach ($recipients as $recipient) {
            if (\App\Support\NotificationPreferences::wantsType($recipient, 'project_deleted')) {
                $notification = \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'project_restored',
                    'causer_id' => Auth::id(),
                    'message' => "Project restored\n\"**{$project->name}**\" was restored from the trash",
                    'url' => route('projects.show', $project->id, false),
                ]);

                try {
                    broadcast(new \App\Events\ProjectRestored($recipient->id, $project->name, $project->id, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            NotificationMailer::send(
                $recipient,
                'project.deletion_requested',
                "{$project->name} was restored",
                ["The project \"**{$project->name}**\" (#{$project->id}) you were a member of was restored from the trash by **" . Auth::user()->name . '**.'],
                url(route('projects.show', $project->id, false)),
                'View Project'
            );
        }

        return redirect()->route('projects.show', $project)->with('success', 'Project restored.');
    }

    /** Permanently deletes a trashed project (and, via the tasks table's cascading FK, everything hanging off it) for good. Cannot be undone. */
    public function forceDeleteProject(Project $project)
    {
        $this->authorize('forceDelete', $project);

        if (! $project->trashed()) {
            return back()->with('success', 'That project is not in the trash.');
        }

        $projectName = $project->name;
        $recipients = $project->members()->where('users.id', '!=', Auth::id())->get();

        foreach ($recipients as $recipient) {
            NotificationMailer::send(
                $recipient,
                'project.deleted',
                "{$projectName} was permanently deleted",
                ["The project \"**{$projectName}**\" (#{$project->id}) you were a member of has been permanently deleted and can no longer be restored."],
            );
        }

        $project->forceDelete();

        return redirect()->route('settings.edit', ['section' => 'trash'])->with('success', "\"{$projectName}\" was permanently deleted.");
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

        // Doesn't run through ProjectPolicy, so the trashed-project freeze needs
        // its own check here - see ProjectPolicy::update()'s docblock.
        abort_if($project->trashed(), 403, 'This project is in the trash and read-only.');

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
                'causer_id' => Auth::id(),
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

        // See show()'s $trashed comment - a trashed project's tasks need
        // withTrashed() or a member opening this mid-grace-period to grab files
        // would find nothing here at all.
        $tasksQuery = $project->tasks();
        if ($project->trashed()) {
            $tasksQuery->withTrashed();
        }

        $tasks = $tasksQuery
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

        $tasksQuery = $project->tasks();
        if ($project->trashed()) {
            $tasksQuery->withTrashed();
        }

        $tasks = $tasksQuery->where('status', 'done')->with('deliverables')->get();

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