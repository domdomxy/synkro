<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Observers\ProjectObserver;
use App\Observers\TaskObserver;
use App\Observers\UserObserver;
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
        // the job up (if one ever did) - they'd never actually encounter the code
        // flow on signup. Sending it directly guarantees the email goes out before
        // the redirect happens.

        // Drives the Welcome page's live Users/Projects/Tasks stat strip. Each
        // observer just triggers a fresh recount-and-broadcast rather than doing
        // incremental math, so cascade-deleted rows (a deleted project's tasks,
        // a deleted user's owned projects and their tasks) are still picked up
        // correctly even though those cascades happen at the database level and
        // never fire their own model events.
        User::observe(UserObserver::class);
        Project::observe(ProjectObserver::class);
        Task::observe(TaskObserver::class);
    }
}
