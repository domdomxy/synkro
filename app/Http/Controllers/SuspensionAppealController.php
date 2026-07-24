<?php

namespace App\Http\Controllers;

use App\Models\SuspensionAppeal;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\AppealRateLimiter;
use App\Support\EmailPreferences;
use App\Support\NotificationPreferences;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class SuspensionAppealController extends Controller
{
    public function store(Request $request)
    {
        // Keyed by email, not IP. An appeal is inherently tied to one specific account —
        // one email maps to exactly one account — so limiting by IP was both too loose
        // (shared networks/VPNs let the same person route around it) and too strict
        // (two different suspended accounts appealing from the same connection would
        // wrongly block each other). Checked before validation, same as the old IP
        // check was, so a throttled request comes back as a normal Inertia error shown
        // inline on the appeal card rather than a bare 429 page.
        $email = (string) $request->input('email');

        if ($message = AppealRateLimiter::message($email, $request)) {
            return back()
                ->withErrors(['limit' => $message])
                ->with('suspension', $this->suspensionPayload($email));
        }

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'message' => 'required|string|max:2000',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user->is_suspended) {
            return back()->withErrors(['email' => 'This account is not currently suspended.']);
        }

        // Scoped to this specific suspension (see AppealRateLimiter) — always non-null
        // here since $user->is_suspended is true, so there's an open suspension_logs row.
        if ($limiterKey = AppealRateLimiter::key($email)) {
            RateLimiter::hit($limiterKey, 6 * 3600);
        }

        $appeal = SuspensionAppeal::create([
            'user_id' => $user->id,
            'message' => $request->message,
        ]);

        $this->notifyAdminsNewAppeal($appeal, $user);

        \App\Support\AdminAlerts::broadcastRefresh();

        return back()
            ->with('success', 'Your appeal has been submitted. We will review it as soon as possible.')
            ->with('suspension', $this->suspensionPayload($user));
    }

    /** Admins can opt out via Settings → both Email Notifications and In-App Notifications → Admin Alerts. */
    private function notifyAdminsNewAppeal(SuspensionAppeal $appeal, User $user): void
    {
        $admins = User::where('role', 'admin')->get();
        $url = url(route('admin.appeals', [], false));

        foreach ($admins as $admin) {
            if (NotificationPreferences::wantsType($admin, 'appeal_created')) {
                $notification = UserNotification::create([
                    'user_id' => $admin->id,
                    'type' => 'appeal_created',
                    'message' => "New appeal submitted\n{$user->name} submitted a suspension appeal",
                    'url' => $url,
                ]);

                try {
                    broadcast(new \App\Events\AppealCreated($admin->id, $appeal->id, $user->name, $notification->id))->toOthers();
                } catch (\Throwable $e) {
                    report($e);
                }
            }

            if (! EmailPreferences::wants($admin, 'admin.appeal_created')) {
                continue;
            }

            try {
                \Illuminate\Support\Facades\Mail::to($admin->email)->queue(new \App\Mail\SynkroNotificationMail(
                    $admin->name,
                    'New suspension appeal submitted',
                    ["{$user->name} ({$user->email}) submitted a suspension appeal:"],
                    $url,
                    'View Appeal',
                    highlight: ['label' => 'Appeal message', 'content' => \App\Support\NoteFormatter::toHtml($appeal->message), 'html' => true],
                ));
            } catch (\Throwable $e) {
                report($e);
            }
        }
    }

    /**
     * Build the same suspension payload shape the login page expects, so it can be
     * re-flashed to session after an appeal submission. Accepts either a User or an
     * email string (the rate-limit path runs before validation, so the user may not
     * be resolved yet).
     */
    private function suspensionPayload(User|string|null $user): ?array
    {
        if (is_string($user)) {
            $user = User::where('email', $user)->first();
        }

        if (! $user || ! $user->is_suspended) {
            return null;
        }

        return [
            'reason' => $user->suspension_reason,
            'until' => $user->suspended_until?->toIso8601String(),
            'permanent' => $user->suspended_until === null,
            'user_id' => $user->id,
            'email' => $user->email,
        ];
    }
}