<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('reminders:send')->everyMinute();
Schedule::command('suspensions:lift-expired')->everyMinute();
Schedule::command('feedback:close-inactive')->hourly();
Schedule::command('tasks:notify-overdue')->everyFifteenMinutes();
Schedule::command('tasks:notify-deadline-reminders')->everyFifteenMinutes();
Schedule::command('accounts:purge-deleted')->daily();
Schedule::command('projects:purge-deleted')->daily();
Schedule::command('tasks:purge-deleted')->daily();
