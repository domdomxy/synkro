<?php
namespace App\Http\Controllers;

use App\Models\ProjectActivityLog;
use App\Models\ProjectInvitation;
use App\Models\UserNotification;
use App\Support\NotificationMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InvitationController extends Controller
{
    public function show(string $token)
    {
        $invitation = ProjectInvitation::with(['project', 'invitedBy'])->where('token', $token)->firstOrFail();

        abort_unless($invitation->invited_user_id === Auth::id(), 403);

        return Inertia::render('Invitations/Show', [
            'invitation' => $invitation,
        ]);
    }

    public function accept(Request $request, string $token)
    {
        $invitation = ProjectInvitation::with('project')->where('token', $token)->firstOrFail();
        abort_unless($invitation->invited_user_id === Auth::id(), 403);

        if ($invitation->status !== 'pending') {
            return back()->withErrors(['error' => 'This invitation has already been responded to.']);
        }

        $invitation->project->members()->attach(Auth::id(), ['role' => $invitation->role]);
        $invitation->update(['status' => 'accepted']);

        ProjectActivityLog::log($invitation->project, 'member_added', [
            'target_name' => Auth::user()->name,
            'role' => $invitation->role,
        ]);

        $inviter = $invitation->invitedBy;
        if ($inviter) {
            $projectUrl = route('projects.show', $invitation->project_id, false);
            UserNotification::create([
                'user_id' => $inviter->id,
                'type' => 'invitation_accepted',
                'message' => Auth::user()->name . " accepted your invitation to \"{$invitation->project->name}\"",
                'url' => $projectUrl,
            ]);

            NotificationMailer::send(
                $inviter,
                'project.invitation_accepted',
                Auth::user()->name . " joined {$invitation->project->name}",
                [Auth::user()->name . " accepted your invitation and joined \"{$invitation->project->name}\" (ID {$invitation->project_id})."],
                url($projectUrl),
                'View Project'
            );
        }

        return redirect()->route('projects.show', $invitation->project_id)->with('success', 'You joined the project.');
    }

    public function deny(Request $request, string $token)
    {
        $invitation = ProjectInvitation::with('project')->where('token', $token)->firstOrFail();
        abort_unless($invitation->invited_user_id === Auth::id(), 403);

        if ($invitation->status !== 'pending') {
            return back()->withErrors(['error' => 'This invitation has already been responded to.']);
        }

        $invitation->update(['status' => 'denied']);

        ProjectActivityLog::log($invitation->project, 'invitation_denied', [
            'target_name' => Auth::user()->name,
        ]);

        $inviter = $invitation->invitedBy;
        if ($inviter) {
            UserNotification::create([
                'user_id' => $inviter->id,
                'type' => 'invitation_denied',
                'message' => Auth::user()->name . " declined your invitation to \"{$invitation->project->name}\"",
                'url' => route('projects.show', $invitation->project_id, false),
            ]);

            NotificationMailer::send(
                $inviter,
                'project.invitation_denied',
                Auth::user()->name . " declined your invitation",
                [Auth::user()->name . " declined your invitation to join \"{$invitation->project->name}\" (ID {$invitation->project_id})."]
            );
        }

        return redirect()->route('projects.index')->with('success', 'Invitation declined.');
    }
}