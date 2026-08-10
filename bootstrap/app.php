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
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'superadmin' => \App\Http\Middleware\EnsureUserIsSuperAdmin::class,
            'password.change' => \App\Http\Middleware\EnsurePasswordIsChanged::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Any request this app can't otherwise satisfy - a route that never
        // existed, a project that's gone, an expired session, a genuine server
        // error - should land on the styled Error page (resources/js/Pages/Error.jsx)
        // instead of Laravel's blank/whoops default. Two renderers cover this:
        // the first below handles HttpException (which covers 403/404/419/429
        // and anything else with a real status code, including
        // ModelNotFoundException/AuthorizationException/TokenMismatchException,
        // which Laravel converts to HttpException subtypes before renderers run);
        // the second is a catch-all for genuinely unexpected Throwables that
        // aren't HttpExceptions at all (a bug causing a 500). Both are skipped
        // for API/JSON callers, who should keep getting a plain JSON error.
        $renderErrorPage = function (int $status, ?string $message, Request $request) {
            if ($request->is('api/*') || ($request->wantsJson() && ! $request->header('X-Inertia'))) {
                return null;
            }

            // HandleInertiaRequests normally shares 'auth' for every page, but
            // it sits in the 'web' group *after* SubstituteBindings (route
            // model binding). A missing/invalid {project} or {task} in the
            // URL throws its ModelNotFoundException from SubstituteBindings
            // before HandleInertiaRequests ever gets a turn, so that share
            // never happens - the Error page would otherwise render with no
            // 'auth' prop at all, and Error.jsx's `Boolean(auth?.user)` reads
            // that as signed-out even for a logged-in visitor (wrong "Log in"
            // button on an otherwise-correct 404/403). Sharing it explicitly
            // here, right before rendering, makes the Error page correct
            // regardless of which middleware ran before the exception fired.
            \Inertia\Inertia::share('auth', [
                'user' => $request->user(),
                'session_id' => $request->hasSession() ? $request->session()->getId() : null,
            ]);

            return \Inertia\Inertia::render('Error', [
                'status' => $status,
                'message' => $message,
            ])->toResponse($request)->setStatusCode($status);
        };

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, Request $request) use ($renderErrorPage) {
            $status = $e->getStatusCode();

            // Generic fallback for any 403 that doesn't carry its own message (raw abort(403)
            // calls, or a policy that just returns false/true with no explanation). Deliberately
            // NOT project-specific: this handler runs for every 403 app-wide (comment ownership,
            // reminder ownership, checklist permissions, etc.), most of which have nothing to do
            // with project membership. A policy can still attach its own person-facing reason
            // (see ProjectPolicy::view()) - but every such message, including the default below,
            // is kept neutral about *why* access is denied, since there's no reliable way to tell
            // "never had access" apart from "used to, and lost it".
            $defaultMessages = [
                403 => "You don't have permission to do that.",
                404 => "That page doesn't exist - it may have been moved, deleted, or never existed.",
                419 => 'For your security, this page timed out. Refresh and try again.',
                429 => "You've made too many requests in a short time. Give it a minute and try again.",
            ];
            $defaultMessage = $defaultMessages[$status] ?? null;

            // 404/419/429 messages are never worth surfacing verbatim (they're
            // Symfony/Laravel's own internal wording, e.g. "No query results
            // for model [App\Models\Project]"), so those always use the
            // friendly default above. 403 is the one case a policy might have
            // attached a real, person-facing reason to (see ProjectPolicy::view()).
            $message = $status === 403
                ? (($e->getMessage() && ! str_starts_with($e->getMessage(), 'This action is unauthorized'))
                    ? $e->getMessage()
                    : $defaultMessage)
                : $defaultMessage;

            // A dedicated page rather than redirect()->back(): back() depends on
            // the session's previous URL, which for a directly-typed/bookmarked
            // link (no HTTP referer) can be some unrelated page the person had
            // open earlier - e.g. Settings - making the "redirect" look random
            // and disconnected from what they actually tried to open. Rendering
            // in place always shows the right thing regardless of history.
            return $renderErrorPage($status, $message, $request);
        });

        // Catch-all for anything that isn't even an HttpException - a genuine
        // bug (TypeError, DB error, etc). Only takes over once debug mode is
        // off: locally (APP_DEBUG=true) you still get Laravel's normal full
        // stack trace so real bugs stay easy to find, but a live/shared
        // instance never shows a visitor a blank page or a raw stack trace.
        // This never hides anything from the logs - exception reporting runs
        // separately from rendering, so it's still written to storage/logs
        // either way.
        $exceptions->render(function (\Throwable $e, Request $request) use ($renderErrorPage) {
            if (config('app.debug')) {
                return null;
            }

            $status = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            return $renderErrorPage($status, null, $request);
        });
    })->create();
