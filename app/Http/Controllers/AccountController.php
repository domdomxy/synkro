<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountUpdateRequest;
use App\Models\AccountActivityLog;
use App\Models\User;
use App\Events\AccountDeleted;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use App\Support\NotificationMailer;
use App\Support\NotificationPreferences;
use App\Mail\SynkroNotificationMail;
use Illuminate\Support\Facades\Mail;

class AccountController extends Controller
{
    /**
     * Display the user's account form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Account/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'deletionRequestedAt' => $request->user()->deletion_requested_at,
        ]);
    }

    /**
     * Update the user's account information.
     */
    public function update(AccountUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $oldEmail = $user->getOriginal('email');
        $oldName = $user->getOriginal('name');
        $newEmail = $request->validated()['email'];
        $emailChanged = $oldEmail !== $newEmail;

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        $changes = [];
        if ($user->wasChanged('name')) {
            $changes['name'] = ['old' => $oldName, 'new' => $user->name];
        }
        if ($user->wasChanged('email')) {
            $changes['email'] = ['old' => $oldEmail, 'new' => $newEmail];
        }
        if (! empty($changes)) {
            AccountActivityLog::log('profile_updated', ['changes' => $changes]);
        }

        if ($emailChanged) {
            // Security alert goes to the OLD address (that's the account that might be compromised).
            try {
                Mail::to($oldEmail)->queue(new SynkroNotificationMail(
                    $user->name,
                    'Your email address was changed',
                    [
                        "Your Synkro account email was changed from {$oldEmail} to {$newEmail}.",
                        "If you didn't make this change, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately.',
                    ]
                ));
            } catch (\Throwable $e) {
                report($e);
            }

            // Optional confirmation to the new address too.
            NotificationMailer::send(
                $user,
                'account.email_changed',
                'Your email address was updated',
                ["Your Synkro account email is now {$newEmail}."]
            );
        }

        return Redirect::route('account.edit');
    }

    /**
     * Step 1 of account deletion: verify the password and email a signed
     * confirmation link. Nothing about the account is deleted here — the
     * account only actually gets deleted once that link is clicked (see
     * confirmDeletion below). This means a compromised or shared session
     * can't destroy the account by itself; the owner's inbox has to agree too.
     */
    public function requestDeletion(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $user->forceFill(['deletion_requested_at' => now()])->save();

        AccountActivityLog::log('account_deletion_requested');

        $user->sendAccountDeletionConfirmationNotification();

        return Redirect::route('account.edit')->with(
            'success',
            "We've sent a confirmation link to {$user->email}. Your account won't be deleted until you click it."
        );
    }

    /**
     * Step 2: the actual deletion, only reachable via the signed link emailed
     * in requestDeletion(). Deliberately does NOT require an authenticated
     * session, since the link may be opened from a different device/browser
     * than the one that requested deletion, or after the original session
     * has already expired.
     */
    public function confirmDeletion(Request $request, User $user): RedirectResponse
    {
        // The request must still be pending. Guards against a stale/reused
        // link after the user already cancelled the request (or it was
        // already carried out) from firing a second time.
        if (! $user->deletion_requested_at) {
            return Redirect::route('login')->with(
                'status',
                'This account deletion link has already been used or cancelled.'
            );
        }

        // If the person confirming is still logged in as this same user,
        // log them out. If the link is opened from a different session
        // (or no session at all), leave whatever session is active alone.
        if (Auth::check() && Auth::id() === $user->id) {
            Auth::logout();
        }

        // For every project the user belongs to, handle their tasks
        foreach ($user->projects as $project) {
            if ($project->owner_id === $user->id) {
                continue; // owner deleting account, project stays, no cascade needed here
            }

            $role = $project->roleFor($user);

            // Freeze tasks that are in-progress states, reset the rest
            $tasks = $project->tasks()->where('assigned_to', $user->id)->get();
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

            \App\Models\Comment::where('user_id', $user->id)
                ->whereIn('task_id', $resettable->pluck('id'))
                ->delete();

            $project->members()->detach($user->id);

            // Notify owners and managers
            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', $user->id)
                ->get();

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    $notification = \App\Models\UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'message' => "Member left\n{$user->name} ({$role}) deleted their account; their tasks in \"{$project->name}\" may need attention",
                        'url' => route('projects.show', $project->id, false),
                    ]);

                    try {
                        broadcast(new \App\Events\MemberLeftProject($recipient->id, $user->name, $role ?? 'member', $project, $notification->id))->toOthers();
                    } catch (\Throwable $e) {
                        report($e);
                    }
                }
            }
        }
        NotificationMailer::send(
            $user,
            'account.deleted',
            'Your account has been deleted',
            [
                'Your Synkro account and associated data have been permanently deleted.',
                "If you didn't request this, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately.',
            ]
        );

        $user->delete();

        // Let any other open tab/device for this user know in real time,
        // instead of waiting for their next navigation to bounce them to
        // login once the session can no longer resolve a user.
        try {
            event(new AccountDeleted($user->id));
        } catch (\Throwable $e) {
            report($e);
        }

        if (! Auth::check()) {
            // Only true if we logged the confirming session out above, i.e.
            // it belonged to the account that was just deleted.
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return Redirect::route('login')->with('status', 'Your account has been permanently deleted.');
    }

    /**
     * Cancel a pending deletion request before its confirmation link is used.
     */
    public function cancelDeletion(Request $request): RedirectResponse
    {
        $user = $request->user();

        $user->forceFill(['deletion_requested_at' => null])->save();

        AccountActivityLog::log('account_deletion_cancelled');

        return Redirect::route('account.edit')->with('success', 'Account deletion cancelled.');
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate(['avatar' => ['required', 'image', 'max:2048']]);

        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update(['avatar_path' => $request->file('avatar')->store('avatars', 'public')]);

        AccountActivityLog::log('avatar_updated');

        return Redirect::route('account.edit')->with('success', 'Avatar updated.');
    }

    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
            AccountActivityLog::log('avatar_removed');
        }

        return Redirect::route('account.edit')->with('success', 'Avatar removed.');
    }
    public function deactivate(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();

        // Freeze or reset tasks across all projects
        foreach ($user->projects as $project) {
            if ($project->owner_id === $user->id) continue;

            $tasks = $project->tasks()->where('assigned_to', $user->id)->get();
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

            \App\Models\Comment::where('user_id', $user->id)
                ->whereIn('task_id', $resettable->pluck('id'))
                ->delete();

            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', $user->id)
                ->get();

            $role = $project->roleFor($user) ?? 'member';

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    \App\Models\UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'message' => "Member left\n{$user->name} ({$role}) deactivated their account; their tasks in \"{$project->name}\" may need attention",
                        'url' => route('projects.show', $project->id, false),
                    ]);
                }
            }
        }

        NotificationMailer::send(
            $user,
            'account.deactivated',
            'Your account has been deactivated',
            [
                'Your Synkro account has been deactivated.',
                'Simply log back in at any time to reactivate it automatically.',
            ]
        );

        $user->update(['is_active' => false, 'active_status_changed_at' => now()]);

        AccountActivityLog::log('account_deactivated', [], $user->id);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Your account has been deactivated. Log in again to reactivate it.');
    }
}
