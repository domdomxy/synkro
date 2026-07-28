<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Verification codes are sent synchronously from RegisteredUserController
        // instead of via the framework's queued `Registered` listener. That listener
        // implements ShouldQueue, so with the default QUEUE_CONNECTION=database and
        // no queue worker running, a brand-new user could land on the verify-email
        // code screen with no code ever generated or emailed until a worker picked
        // the job up (if one ever did) — they'd never actually encounter the code
        // flow on signup. Sending it directly guarantees the email goes out before
        // the redirect happens.
    }
}
