<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use App\Support\NotificationMailer;
use App\Mail\SynkroNotificationMail;
use Illuminate\Support\Facades\Mail;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $oldEmail = $user->getOriginal('email');
        $newEmail = $request->validated()['email'];
        $emailChanged = $oldEmail !== $newEmail;

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($emailChanged) {
            // Security alert goes to the OLD address (that's the account that might be compromised).
            try {
                Mail::to($oldEmail)->queue(new SynkroNotificationMail(
                    $user->name,
                    'Your email address was changed',
                    [
                        "Your Synkro account email was changed from {$oldEmail} to {$newEmail}.",
                        "If you didn't make this change, please contact support immediately.",
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

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

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
                $notification = \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'member_left',
                    'message' => "{$user->name} ({$role}) deleted their account; their tasks in \"{$project->name}\" may need attention",
                    'url' => route('projects.show', $project->id, false),
                ]);

                try {
                    broadcast(new \App\Events\MemberLeftProject($recipient->id, $user->name, $role ?? 'member', $project, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
        }
        NotificationMailer::send(
            $user,
            'account.deleted',
            'Your account has been deleted',
            [
                'Your Synkro account and associated data have been permanently deleted.',
                "If you didn't request this, please contact support immediately.",
            ]
        );
        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate(['avatar' => ['required', 'image', 'max:2048']]);

        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update(['avatar_path' => $request->file('avatar')->store('avatars', 'public')]);

        return Redirect::route('profile.edit')->with('success', 'Avatar updated.');
    }

    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
        }

        return Redirect::route('profile.edit')->with('success', 'Avatar removed.');
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
                \App\Models\UserNotification::create([
                    'user_id' => $recipient->id,
                    'type' => 'member_left',
                    'message' => "{$user->name} ({$role}) deactivated their account; their tasks in \"{$project->name}\" may need attention",
                    'url' => route('projects.show', $project->id, false),
                ]);
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

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Your account has been deactivated. Log in again to reactivate it.');
    }
}
