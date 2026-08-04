<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Feedback;
use App\Models\SuspensionAppeal;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                // Same id already sent per-row in the "Logged in devices" list
                // (DeviceSessionData) marking is_current - shared here too so
                // any listener can tell whether a DeviceDisconnected broadcast
                // is about *this* tab without a fresh round trip. Not new
                // exposure, just the same value made available app-wide.
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'feedback_tracking_id' => fn () => $request->session()->get('feedback_tracking_id'),
                'passwordExpired' => fn () => $request->session()->get('passwordExpired'),
                ],
            'notifications' => [
            'unreadCount' => fn () => $request->user()?->notifications()->whereNull('read_at')->count() ?? 0,
            // Was a flat "latest 10 total" (read + unread mixed), so the bell's
            // Unread filter (client-side only, filters this same array) could come
            // up empty even with a nonzero unreadCount badge, whenever the unread
            // ones weren't among the 10 most recently created overall. Unread items
            // are fetched first (up to 10) so they're always present in this
            // preview list, then padded with the most recent read ones and
            // re-sorted by recency for display.
            'recent' => fn () => (function () use ($request) {
                $user = $request->user();

                if (! $user) {
                    return [];
                }

                $unread = $user->notifications()->with('causer')->whereNull('read_at')->limit(10)->get();
                $remaining = 10 - $unread->count();

                $read = $remaining > 0
                    ? $user->notifications()->with('causer')->whereNotNull('read_at')->limit($remaining)->get()
                    : collect();

                return $unread->concat($read)->sortByDesc('created_at')->values();
            })(),
            ],
            'testing' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return null;
                }

                $reviewerProjectIds = $user->projects()
                    ->wherePivotIn('role', ['owner', 'manager', 'tester'])
                    ->pluck('projects.id');

                if ($reviewerProjectIds->isEmpty()) {
                    return null;
                }

                return [
                    'pendingCount' => \App\Models\Task::whereIn('project_id', $reviewerProjectIds)
                        ->whereIn('status', ['submitted', 'in_review'])
                        ->count(),
                ];
            })(),
            'adminAlerts' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || ! $user->isAdmin()) {
                    return null;
                }

                return [
                    'hasPending' => \App\Support\AdminAlerts::hasPending(),
                ];
            })(),
        ];
    }
}