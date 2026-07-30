<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use App\Http\Middleware\CheckSuspended;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->encryptCookies(except: ['device_timezone']);
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            CheckSuspended::class,
        ]);
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'password.change' => \App\Http\Middleware\EnsurePasswordIsChanged::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, Request $request) {
            $status = $e->getStatusCode();

            if (! in_array($status, [403, 404], true)) {
                return null;
            }

            if ($request->is('api/*') || $request->wantsJson() && ! $request->header('X-Inertia')) {
                return null;
            }

            // Generic fallback for any 403 that doesn't carry its own message (raw abort(403)
            // calls, or a policy that just returns false/true with no explanation). Deliberately
            // NOT project-specific: this handler runs for every 403 app-wide (comment ownership,
            // reminder ownership, checklist permissions, etc.), most of which have nothing to do
            // with project membership. The "you may have left or been removed" wording only shows
            // up when a policy attaches it explicitly - see ProjectPolicy::view().
            $defaultMessage = $status === 404
                ? "That no longer exists — it may have been deleted."
                : "You don't have permission to do that.";

            $message = $status === 404
                ? $defaultMessage
                : (($e->getMessage() && ! str_starts_with($e->getMessage(), 'This action is unauthorized'))
                    ? $e->getMessage()
                    : $defaultMessage);

            return redirect()->back(fallback: route('projects.index'))
                ->withErrors(['error' => $message]);
        });
    })->create();
