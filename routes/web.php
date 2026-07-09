<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserSearchController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\ProjectNoteController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Admin\FeedbackAdminController;
use App\Http\Controllers\FeedbackPageController;
use App\Http\Controllers\SuspensionAppealController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\SettingsController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'auth' => ['user' => auth()->user()],
        'flash' => session()->only(['feedback_tracking_id']),
    ]);
});

Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
Route::post('/feedback/track', [FeedbackController::class, 'track'])->name('feedback.track');
Route::get('/feedback', [FeedbackPageController::class, 'index'])->name('feedback.page');
Route::post('/feedback/reply', [FeedbackController::class, 'reply'])->middleware('throttle:10,60')->name('feedback.reply');
Route::post('/feedback/close', [FeedbackController::class, 'close'])->middleware('throttle:10,60')->name('feedback.close');
Route::post('/feedback/reopen', [FeedbackController::class, 'reopen'])->middleware('throttle:10,60')->name('feedback.reopen');

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::post('/appeal', [SuspensionAppealController::class, 'store'])
    ->middleware('throttle:3,60') // 3 attempts per 60 minutes per IP
    ->name('appeal.store');

Route::get('/appeal', function () {
    return Inertia::render('Auth/Appeal');
})->name('appeal.page');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');
    Route::post('/profile/deactivate', [ProfileController::class, 'deactivate'])->name('profile.deactivate');
    Route::resource('projects', ProjectController::class);
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
    Route::patch('/projects/{project}/members/{user}', [ProjectMemberController::class, 'update'])->name('projects.members.update');
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy');
    Route::delete('/projects/{project}/leave', [ProjectMemberController::class, 'leave'])->name('projects.leave');
    Route::patch('/projects/{project}/transfer-ownership', [ProjectController::class, 'transferOwnership'])->name('projects.transfer-ownership');
    Route::post('/projects/{project}/notes', [ProjectNoteController::class, 'store'])->name('projects.notes.store');
    Route::patch('/notes/{note}', [ProjectNoteController::class, 'update'])->name('projects.notes.update');
    Route::delete('/notes/{note}', [ProjectNoteController::class, 'destroy'])->name('projects.notes.destroy');
    Route::delete('/projects/{project}/notes', [ProjectNoteController::class, 'clearAll'])->name('projects.notes.clear');
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::get('/projects/{project}/settings', [ProjectController::class, 'settings'])->name('projects.settings');
    Route::get('/projects/{project}/logs', [ProjectController::class, 'logs'])->name('projects.logs');
    Route::post('/projects/{project}/archive', [ProjectController::class, 'archive'])->name('projects.archive');
    Route::post('/projects/{project}/unarchive', [ProjectController::class, 'unarchive'])->name('projects.unarchive');
    Route::post('/projects/{project}/pin', [ProjectController::class, 'pin'])->name('projects.pin');
    Route::post('/projects/{project}/unpin', [ProjectController::class, 'unpin'])->name('projects.unpin');

    Route::patch('/tasks/{task}/resolve', [TaskController::class, 'resolvePending'])->name('tasks.resolve');
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::patch('/tasks/{task}/start', [TaskController::class, 'start'])->name('tasks.start');
    Route::post('/tasks/{task}/submit', [TaskController::class, 'submit'])->name('tasks.submit');
    Route::patch('/tasks/{task}/start-review', [TaskController::class, 'startReview'])->name('tasks.start-review');
    Route::post('/tasks/{task}/review', [TaskController::class, 'review'])->name('tasks.review');
    Route::post('/tasks/{task}/pin', [TaskController::class, 'pin'])->name('tasks.pin');
    Route::post('/tasks/{task}/unpin', [TaskController::class, 'unpin'])->name('tasks.unpin');
    Route::post('/tasks/{task}/reopen', [TaskController::class, 'reopen'])->name('tasks.reopen');

    Route::post('/tasks/{task}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');

    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('/notifications', [NotificationController::class, 'destroyAll'])->name('notifications.clear');
    Route::get('/users/search', [UserSearchController::class, 'search'])->name('users.search');
    Route::delete('/deliverables/{deliverable}', [TaskController::class, 'destroyDeliverable'])->name('deliverables.destroy');
    Route::post('/reminders', [ReminderController::class, 'store'])->name('reminders.store');
    Route::patch('/reminders/{reminder}/dismiss', [ReminderController::class, 'dismiss'])->name('reminders.dismiss');
    Route::delete('/reminders/{reminder}', [ReminderController::class, 'destroy'])->name('reminders.destroy');
    Route::post('/suspended-logout', [AuthenticatedSessionController::class, 'suspendedLogout'])->name('suspended-logout');


    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::get('/settings-settings', [SettingsController::class, 'edit']); // tolerate the redundant suffix too

    Route::match(['patch'], '/settings/email', [SettingsController::class, 'updateEmailPreferences'])->name('settings.email');
    Route::match(['patch'], '/settings/email-settings', [SettingsController::class, 'updateEmailPreferences'])->name('settings.email-settings');

    Route::match(['patch'], '/settings/notifications', [SettingsController::class, 'updateNotificationPreferences'])->name('settings.notifications');
    Route::match(['patch'], '/settings/notifications-settings', [SettingsController::class, 'updateNotificationPreferences'])->name('settings.notifications-settings');

    

});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/users/{user}/suspend', [AdminController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/lift-suspension', [AdminController::class, 'liftSuspension'])->name('users.lift-suspension');
    Route::patch('/users/{user}/toggle-role', [AdminController::class, 'toggleRole'])->name('users.toggle-role');
    Route::get('/projects', [AdminController::class, 'projects'])->name('projects');
    Route::delete('/projects/{project}', [AdminController::class, 'destroyProject'])->name('projects.destroy');
    Route::get('/feedbacks', [FeedbackAdminController::class, 'index'])->name('feedbacks');
    Route::patch('/feedbacks/{feedback}/status', [FeedbackAdminController::class, 'updateStatus'])->name('feedbacks.status');
    Route::post('/feedbacks/{feedback}/respond', [FeedbackAdminController::class, 'respond'])->name('feedbacks.respond');
    Route::get('/appeals', [AdminController::class, 'appeals'])->name('appeals');
    Route::patch('/appeals/{appeal}', [AdminController::class, 'reviewAppeal'])->name('appeals.review');
    Route::post('/users/{user}/reset-password', [AdminController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/projects/{project}/logs', [AdminController::class, 'projectLogs'])->name('projects.logs');
    });

require __DIR__.'/auth.php';