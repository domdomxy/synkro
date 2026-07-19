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
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'feedback_tracking_id' => fn () => $request->session()->get('feedback_tracking_id'),
                'passwordExpired' => fn () => $request->session()->get('passwordExpired'),
                ],
            'notifications' => [
            'unreadCount' => fn () => $request->user()?->notifications()->whereNull('read_at')->count() ?? 0,
            'recent' => fn () => $request->user()?->notifications()->limit(10)->get() ?? [],
            ],
            'adminAlerts' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || $user->role !== 'admin') {
                    return null;
                }

                return [
                    'hasPending' => \App\Support\AdminAlerts::hasPending(),
                ];
            })(),
        ];
    }
}