<?php

namespace App\Http\Controllers;

use App\Events\MemberLeftProject;
use App\Events\ProjectInvitationSent;
use App\Events\ProjectRoleChanged;
use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectActivityLog;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\RemovedFromProject;
use App\Support\NotificationMailer;
use App\Models\ProjectInvitation;

class ProjectMemberController extends Controller
{
    private function freezeOrReset(Project $project, int $userId): void
    {
        $tasks = $project->tasks()->where('assigned_to', $userId)->get();

        $resettable = $tasks->whereNotIn('status', ['done', 'submitted', 'in_review']);
        $frozen = $tasks->whereIn('status', ['done', 'submitted', 'in_review']);

        if ($resettable->isNotEmpty()) {
            $project->tasks()->whereIn('id', $resettable->pluck('id'))->update([
                'assigned_to' => null,
                'status' => 'todo',
            ]);
        }

        if ($frozen->isNotEmpty()) {
            $project->tasks()->whereIn('id', $frozen->pluck('id'))->update([
                'pending_resolution' => true,
            ]);
        }

        Comment::where('user_id', $userId)
            ->whereIn('task_id', $resettable->pluck('id'))
            ->delete();
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manageMembers', $project);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:manager,member,tester',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($project->isMember($user)) {
            return back()->withErrors(['email' => 'This user is already a member.']);
        }

        if (ProjectInvitation::where('project_id', $project->id)->where('invited_user_id', $user->id)->where('status', 'pending')->exists()) {
            return back()->withErrors(['email' => 'This user already has a pending invitation.']);
        }

        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'invited_user_id' => $user->id,
            'invited_by' => Auth::id(),
            'role' => $validated['role'],
        ]);

        $inviteUrl = route('invitations.show', $invitation->token, false);

        $notification = UserNotification::create([
            'user_id' => $user->id,
            'type' => 'project_invitation',
            'message' => "{$request->user()->name} invited you to join \"{$project->name}\" as {$validated['role']}",
            'url' => $inviteUrl,
        ]);

        try {
            broadcast(new ProjectInvitationSent($user->id, $project, $validated['role'], $request->user()->name, $invitation->token, $notification->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        NotificationMailer::send(
            $user,
            'project.invitation_received',
            "{$request->user()->name} invited you to join {$project->name}",
            ["{$request->user()->name} invited you to join the project \"{$project->name}\" (ID {$project->id}) as {$validated['role']}."],
            url($inviteUrl),
            'View Invitation'
        );

        return back()->with('success', 'Invitation sent.');
    }

    public function destroyInvitation(ProjectInvitation $invitation)
    {
        $this->authorize('manageMembers', $invitation->project);
        $invitation->delete();
        return back()->with('success', 'Invitation cancelled.');
    }

    public function update(Request $request, Project $project, User $user)
    {
        $this->authorize('manageMembers', $project);

        $validated = $request->validate([
            'role' => 'required|in:manager,member,tester',
        ]);

        $member = $project->members()->where('user_id', $user->id)->first();
        $oldRole = $member?->pivot->role;

        $project->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        if ($oldRole && $oldRole !== $validated['role']) {
            ProjectActivityLog::log($project, 'role_changed', [
                'target_name' => $user->name,
                'old_role' => $oldRole,
                'new_role' => $validated['role'],          
            ]);

            $notification = UserNotification::create([
                'user_id' => $user->id,
                'type' => 'project_role_changed',
                'message' => "Your role in \"{$project->name}\" changed from {$oldRole} to {$validated['role']}",
                'url' => route('projects.show', $project->id, false),
            ]);

            try {
                broadcast(new ProjectRoleChanged($user->id, $project, $oldRole, $validated['role'], $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
            NotificationMailer::send(
                $user,
                'project.role_changed',
                "Your role changed in {$project->name}",
                ["Your role in \"{$project->name}\" changed from {$oldRole} to {$validated['role']}."],
                url(route('projects.show', $project->id, false)),
                'View Project'
            );
        }

        return back()->with('success', 'Role updated.');
    }

    public function destroy(Project $project, User $user)
    {
        $this->authorize('manageMembers', $project);

        if ($project->owner_id === $user->id) {
            return back()->withErrors(['error' => 'Cannot remove the project owner.']);
        }

        $member = $project->members()->where('user_id', $user->id)->first();
        $role = $member?->pivot->role;

        $this->freezeOrReset($project, $user->id);

        $project->members()->detach($user->id);

        $notification = \App\Models\UserNotification::create([
            'user_id' => $user->id,
            'type' => 'removed_from_project',
            'message' => "You were removed from \"{$project->name}\"",
            'url' => route('projects.index', [], false),
        ]);

        try {
            broadcast(new RemovedFromProject($user->id, $project, $notification->id))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        NotificationMailer::send(
            $user,
            'project.removed',
            "You were removed from {$project->name}",
            ["You've been removed from the project \"{$project->name}\"."]
        );

        ProjectActivityLog::log($project, 'member_removed', [
            'target_name' => $user->name,
            'role' => $role,
        ]);

        return back()->with('success', 'Member removed.');
    }

    public function leave(Project $project)
    {
        $member = $project->members()->where('user_id', Auth::id())->first();

        if (! $member) {
            abort(403);
        }

        if ($project->owner_id === Auth::id()) {
            return back()->withErrors(['error' => 'Transfer ownership before leaving this project.']);
        }

        $leavingRole = $member->pivot->role;
        $leavingName = Auth::user()->name;

        $this->freezeOrReset($project, Auth::id());

        $project->members()->detach(Auth::id());

        ProjectActivityLog::log($project, 'member_left', [
            'target_name' => $leavingName,
            'role' => $leavingRole,
        ]);

        $recipients = $project->members()
            ->wherePivotIn('role', ['owner', 'manager'])
            ->where('users.id', '!=', Auth::id())
            ->get();

        foreach ($recipients as $recipient) {
            $notification = UserNotification::create([
                'user_id' => $recipient->id,
                'type' => 'member_left',
                'message' => "{$leavingName} ({$leavingRole}) left \"{$project->name}\"",
                'url' => route('projects.show', $project->id, false),
            ]);

            try {
                broadcast(new MemberLeftProject($recipient->id, $leavingName, $leavingRole, $project, $notification->id))->toOthers();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return redirect()->route('projects.index')->with('success', 'You left the project.');
    }
}