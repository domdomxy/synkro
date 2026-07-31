<?php

namespace App\Http\Controllers;

use App\Http\Requests\AccountUpdateRequest;
use App\Models\AccountActivityLog;
use App\Models\User;
use App\Models\UserNotification;
use App\Events\AccountDeleted;
use App\Events\EmailChanged;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'deletionGraceDays' => (int) config('synkro.account_deletion_grace_days', 7),
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
                        "Your Synkro account email was changed from **{$oldEmail}** to **{$newEmail}**.",
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
                ["Your Synkro account email is now **{$newEmail}**."]
            );

            if (NotificationPreferences::wantsType($user, 'email_changed')) {
                $notification = UserNotification::create([
                    'user_id' => $user->id,
                    'type' => 'email_changed',
                    'message' => "Email address changed\nYour account email is now **{$newEmail}**.",
                    'url' => route('account.edit', [], false),
                ]);

                try {
                    broadcast(new EmailChanged($user->id, $newEmail, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }
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

        // Needed by both branches below (and again after delete() further down,
        // once $user->deletionGraceEndsAt() itself becomes queryable) — computed
        // once here so both notifications quote the same restore deadline.
        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);
        $graceEndsAt = now()->addDays($graceDays);

        // For every project the user belongs to, handle their tasks
        foreach ($user->projects as $project) {
            if ($project->owner_id === $user->id) {
                // Project itself is untouched — nothing to reassign or freeze,
                // since none of its tasks change ownership just because the
                // owner's account is (for now) only pending deletion. Other
                // members still need to know, though: they may want to export
                // data while they can, and the deadline isn't final if the
                // owner changes their mind.
                $recipients = $project->members()->where('users.id', '!=', $user->id)->get();

                foreach ($recipients as $recipient) {
                    if (NotificationPreferences::wantsType($recipient, 'owner_account_deleted')) {
                        $notification = \App\Models\UserNotification::create([
                            'user_id' => $recipient->id,
                            'type' => 'owner_account_deleted',
                            'message' => "Owner account deleted\n**{$user->name}**, the owner of \"**{$project->name}**\", deleted their account. The project itself is unaffected for now, but it's worth exporting anything you need — if they don't restore their account by the end of " . $graceEndsAt->format('M j, Y') . ', it and everything in it will be gone for good.',
                            'url' => route('projects.show', $project->id, false),
                        ]);

                        try {
                            broadcast(new \App\Events\OwnerAccountDeleted($recipient->id, $user->name, $project, $graceEndsAt->toIso8601String(), $notification->id))->toOthers();
                        } catch (\Throwable $e) {
                            report($e);
                        }
                    }

                    NotificationMailer::send(
                        $recipient,
                        'project.owner_account_deleted',
                        "{$project->name}'s owner deleted their account",
                        [
                            "**{$user->name}**, the owner of \"**{$project->name}**\" (#{$project->id}), deleted their account.",
                            "The project stays exactly as it is for now. If they don't restore their account by the end of " . $graceEndsAt->format('M j, Y') . ", the project and everything in it will be permanently deleted along with it — you may want to export anything you need before then.",
                            'If they log back in and restore their account before then, nothing changes and this notice can be ignored.',
                        ],
                        route('projects.show', $project->id),
                        'View Project'
                    );
                }

                continue;
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

            // Notify owners and managers. Called out separately whenever there
            // are frozen (pending_resolution) tasks, since those need an actual
            // decision — Resolve Pending on each one, from the project page —
            // rather than just being a heads-up like the rest of this message.
            $recipients = $project->members()
                ->wherePivotIn('role', ['owner', 'manager'])
                ->where('users.id', '!=', $user->id)
                ->get();

            $frozenCount = $frozen->count();
            $frozenNote = $frozenCount > 0
                ? ($frozenCount === 1
                    ? ' 1 of their tasks is frozen pending your decision — resolve it from the project page before it can move again.'
                    : " {$frozenCount} of their tasks are frozen pending your decision — resolve them from the project page before they can move again.")
                : '';

            foreach ($recipients as $recipient) {
                if (NotificationPreferences::wantsType($recipient, 'member_left')) {
                    $notification = \App\Models\UserNotification::create([
                        'user_id' => $recipient->id,
                        'type' => 'member_left',
                        'message' => "Member left\n**{$user->name}** ({$role}) deleted their account.{$frozenNote}",
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
        $user->delete();

        AccountActivityLog::log('account_deleted', [], $user->id);

        $graceDays = (int) config('synkro.account_deletion_grace_days', 7);
        $graceEndsAt = $user->deletionGraceEndsAt();

        NotificationMailer::send(
            $user,
            'account.deleted',
            'Your account has been deleted',
            [
                "Your Synkro account has been deleted and is no longer accessible.",
                "It will be kept for {$graceDays} more day(s) (until the end of " . $graceEndsAt->format('M j, Y') . ') in case you change your mind — simply log back in with your usual email and password before then to restore it yourself.',
                "After that, it will be permanently deleted and can't be recovered.",
                "If you didn't request this, please [contact support](" . url(route('feedback.page', [], false)) . ') immediately.',
            ]
        );

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

        return Redirect::route('login')->with(
            'status',
            "Your account has been deleted. You can restore it by logging back in within {$graceDays} day(s) — after that it's gone for good."
        );
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

    /**
     * Step 1 of self-service restore: email a fresh 6-digit code to an
     * account still inside its post-deletion grace period. Deliberately
     * unauthenticated (a soft-deleted account can't hold a session).
     * Called both to seed the code the moment the pending-deletion screen
     * is first shown, and again by its "Resend code" button.
     */
    public function sendRestoreCode(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $user = User::withTrashed()->where('email', $request->string('email'))->first();

        if (! $user || ! $user->trashed() || ! $user->isRestorable()) {
            return Redirect::route('login')->withErrors(['email' => trans('auth.failed')]);
        }

        $user->sendAccountRestoreCodeNotification();

        return Redirect::route('login')->with('pendingDeletion', [
            'email' => $user->email,
            'restoreBy' => $user->deletionGraceEndsAt()->toIso8601String(),
        ]);
    }

    /**
     * Step 2: verify the emailed code and restore the account. Deliberately
     * unauthenticated, same reasoning as sendRestoreCode() above — the code
     * itself (proving inbox access) is what authorizes the restore, not
     * anything carried over from the login attempt that got redirected here.
     */
    public function restore(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $user = User::withTrashed()->where('email', $request->string('email'))->first();

        if (! $user || ! $user->trashed()) {
            return Redirect::route('login')->withErrors(['email' => trans('auth.failed')]);
        }

        if (! $user->isRestorable()) {
            return Redirect::route('login')->withErrors([
                'email' => "This account's grace period has ended and it can no longer be restored. Please contact support if you need help.",
            ]);
        }

        // Any failure below re-shows the same pending-deletion screen (rather
        // than falling through to the generic login error) so the person can
        // simply retry the code or hit resend, instead of restarting login.
        $pendingDeletion = [
            'email' => $user->email,
            'restoreBy' => $user->deletionGraceEndsAt()->toIso8601String(),
        ];

        if (! $user->restore_code || ! $user->restore_code_expires_at || now()->greaterThan($user->restore_code_expires_at)) {
            return Redirect::route('login')
                ->withErrors(['code' => 'This code has expired. Request a new one.'])
                ->with('pendingDeletion', $pendingDeletion);
        }

        if ($user->restore_code_attempts >= 5) {
            return Redirect::route('login')
                ->withErrors(['code' => 'Too many incorrect attempts. Request a new code.'])
                ->with('pendingDeletion', $pendingDeletion);
        }

        if (! Hash::check($request->string('code'), $user->restore_code)) {
            $user->increment('restore_code_attempts');

            return Redirect::route('login')
                ->withErrors(['code' => 'The code you entered is incorrect.'])
                ->with('pendingDeletion', $pendingDeletion);
        }

        $user->restore();
        $user->forceFill([
            'deletion_requested_at' => null,
            'restore_code' => null,
            'restore_code_expires_at' => null,
            'restore_code_attempts' => 0,
        ])->save();

        AccountActivityLog::log('account_restored', [], $user->id);

        $user->sendAccountRestoredNotification();

        // No broadcast here (unlike password/email changes above): the user
        // isn't authenticated yet at this point - restore() runs entirely
        // logged out, and they're about to be redirected to the login page.
        // Nothing's listening on their private channel to receive it live;
        // the row is enough for it to show up in the bell once they log in.
        if (NotificationPreferences::wantsType($user, 'account_restored')) {
            UserNotification::create([
                'user_id' => $user->id,
                'type' => 'account_restored',
                'message' => 'Account restored\nYour Synkro account has been restored. Welcome back!',
                'url' => route('dashboard', [], false),
            ]);
        }

        return Redirect::route('login')->with('status', 'Your account has been restored. You can log back in now.');
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
                        'message' => "Member left\n**{$user->name}** ({$role}) deactivated their account; their tasks in \"**{$project->name}**\" may need attention",
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
