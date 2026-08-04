<?php

use App\Http\Controllers\AccountController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TestingController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserSearchController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\ProjectNoteController;
use App\Http\Controllers\ProjectResourceController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Admin\FeedbackAdminController;
use App\Http\Controllers\Admin\FeedbackCategoryController;
use App\Http\Controllers\FeedbackPageController;
use App\Http\Controllers\SuspensionAppealController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TrustedHostController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\TaskChecklistItemController;
use App\Http\Controllers\TaskDependencyController;
use App\Http\Controllers\TrashController;
use App\Http\Controllers\DeviceSessionController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'auth' => ['user' => auth()->user()],
        'flash' => session()->only(['feedback_tracking_id']),
        'stats' => \App\Support\PlatformStats::counts(),
    ]);
});

Route::get('/privacy', function () {
    return Inertia::render('Privacy');
})->name('privacy');

Route::get('/terms', function () {
    return Inertia::render('TermsOfUse');
})->name('terms');

Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
Route::post('/feedback/track', [FeedbackController::class, 'track'])->name('feedback.track');
Route::get('/feedback', [FeedbackPageController::class, 'index'])->name('feedback.page');
Route::post('/feedback/reply', [FeedbackController::class, 'reply'])->middleware('throttle:10,60')->name('feedback.reply');
Route::post('/feedback/close', [FeedbackController::class, 'close'])->middleware('throttle:10,60')->name('feedback.close');
Route::post('/feedback/reopen', [FeedbackController::class, 'reopen'])->middleware('throttle:10,60')->name('feedback.reopen');

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified', 'password.change'])->name('dashboard');
Route::get('/activity', [DashboardController::class, 'activity'])->middleware(['auth', 'verified', 'password.change'])->name('activity.index');
// Self-service Login History no longer has its own page - it's the "Logged in
// devices" section of Settings now (see SettingsController::edit() +
// DeviceSessionsSection.jsx). Admin's read-only look at a *user's* history
// (below, users.login-history) is a different feature - a real event log for
// support/audit purposes - and is unaffected.

Route::post('/appeal', [SuspensionAppealController::class, 'store'])
    ->name('appeal.store');

Route::get('/appeal', function () {
    return Inertia::render('Auth/Appeal');
})->name('appeal.page');

// Public: reached from the account-deletion confirmation email, which may be
// opened from a different browser/device than the one that requested it, or
// after the requesting session has already expired.
Route::get('/account/{user}/confirm-deletion', [AccountController::class, 'confirmDeletion'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('account.destroy.confirm');

// Public, same reasoning as above: a soft-deleted account has no session to
// authenticate the request with, so restore() itself verifies the emailed code.
Route::post('/account/restore', [AccountController::class, 'restore'])
    ->middleware(['throttle:6,1'])
    ->name('account.restore');

Route::post('/account/restore/send-code', [AccountController::class, 'sendRestoreCode'])
    ->middleware(['throttle:6,1'])
    ->name('account.restore.send-code');

// Everything a logged-in user can actually do with the app (projects, tasks,
// account, settings, invitations, etc.) requires a verified email, same as
// /dashboard — otherwise a freshly-registered, unverified account (which is
// auto-logged-in at registration) could reach all of this directly, e.g. via
// the "View Your Projects" link in the welcome email, bypassing verification
// entirely. It also requires an admin-issued temporary password to have
// actually been changed (see EnsurePasswordIsChanged) rather than only
// nudging for it once at login.
Route::middleware(['auth', 'verified', 'password.change'])->group(function () {
    Route::get('/account', [AccountController::class, 'edit'])->name('account.edit');
    Route::patch('/account', [AccountController::class, 'update'])->name('account.update');
    Route::delete('/account', [AccountController::class, 'requestDeletion'])->name('account.destroy');
    Route::post('/account/cancel-deletion', [AccountController::class, 'cancelDeletion'])->name('account.destroy.cancel');
    Route::post('/account/avatar', [AccountController::class, 'updateAvatar'])->name('account.avatar.update');
    Route::delete('/account/avatar', [AccountController::class, 'destroyAvatar'])->name('account.avatar.destroy');
    Route::post('/account/deactivate', [AccountController::class, 'deactivate'])->name('account.deactivate');
    Route::resource('projects', ProjectController::class)->except(['show']);
    // Split out from the resource() call above and given withTrashed() so a
    // project's members can still open it (read-only - every write route below
    // stays on normal, non-trashed binding) during its trash grace period to
    // collect whatever they need before it's purged for good. Registered after
    // the resource group's edit/create routes, so those more specific paths
    // still match first.
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show')->withTrashed();
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
    Route::patch('/projects/{project}/members/{user}', [ProjectMemberController::class, 'update'])->name('projects.members.update')->withTrashed();
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy')->withTrashed();
    Route::delete('/projects/{project}/leave', [ProjectMemberController::class, 'leave'])->name('projects.leave');
    Route::patch('/projects/{project}/transfer-ownership', [ProjectController::class, 'transferOwnership'])->name('projects.transfer-ownership');
    Route::get('/projects/{project}/confirm-deletion', [ProjectController::class, 'confirmDeletion'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('projects.deletion.confirm');
    // One signed link that confirms every project in a batch at once - used when
    // several projects were selected together from the Trash page's "delete from
    // here" picker, so the owner gets a single email instead of one per project.
    // See ProjectController::sendDeletionConfirmationEmailBatch()/confirmDeletionBatch().
    Route::get('/projects/deletion/confirm-batch', [ProjectController::class, 'confirmDeletionBatch'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('projects.deletion.confirmBatch');
    Route::post('/projects/{project}/cancel-deletion', [ProjectController::class, 'cancelDeletion'])->name('projects.deletion.cancel');
    Route::post('/projects/{project}/resend-deletion-email', [ProjectController::class, 'resendDeletionConfirmation'])
        ->middleware('throttle:5,1')
        ->name('projects.deletion.resend');
    Route::post('/projects/{project}/notes', [ProjectNoteController::class, 'store'])->name('projects.notes.store');
    Route::patch('/notes/{note}', [ProjectNoteController::class, 'update'])->name('projects.notes.update');
    Route::delete('/notes/{note}', [ProjectNoteController::class, 'destroy'])->name('projects.notes.destroy');
    Route::delete('/projects/{project}/notes', [ProjectNoteController::class, 'clearAll'])->name('projects.notes.clear');
    Route::post('/notes/{note}/items', [ProjectNoteController::class, 'addItem'])->name('projects.notes.items.add');
    Route::patch('/notes/{note}/items/{itemId}/toggle', [ProjectNoteController::class, 'toggleItem'])->name('projects.notes.items.toggle');
    Route::delete('/notes/{note}/items/completed', [ProjectNoteController::class, 'clearCompletedItems'])->name('projects.notes.items.clear-completed');
    Route::delete('/notes/{note}/items/{itemId}', [ProjectNoteController::class, 'removeItem'])->name('projects.notes.items.remove');
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::post('/projects/{project}/tasks/bulk', [TaskController::class, 'bulkUpdate'])->name('tasks.bulk');
    // withTrashed() on this read-only group too, same reasoning as projects.show
    // above - settings/logs stay owner/manager-gated inside the controller same
    // as always, this only lets the model itself still bind while trashed.
    Route::get('/projects/{project}/settings', [ProjectController::class, 'settings'])->name('projects.settings')->withTrashed();
    Route::get('/projects/{project}/logs', [ProjectController::class, 'logs'])->name('projects.logs')->withTrashed();
    Route::get('/projects/{project}/deliverables', [ProjectController::class, 'deliverables'])->name('projects.deliverables')->withTrashed();
    Route::get('/projects/{project}/deliverables/download', [ProjectController::class, 'downloadDeliverables'])->name('projects.deliverables.download')->withTrashed();
    Route::get('/projects/{project}/resources', [ProjectResourceController::class, 'index'])->name('projects.resources')->withTrashed();
    Route::post('/projects/{project}/resources', [ProjectResourceController::class, 'store'])->name('projects.resources.store');
    Route::post('/resources/{resource}', [ProjectResourceController::class, 'update'])->name('projects.resources.update');
    Route::delete('/resources/{resource}', [ProjectResourceController::class, 'destroy'])->name('projects.resources.destroy');
    Route::post('/projects/{project}/archive', [ProjectController::class, 'archive'])->name('projects.archive');
    Route::post('/projects/{project}/unarchive', [ProjectController::class, 'unarchive'])->name('projects.unarchive');
    Route::post('/projects/{project}/pin', [ProjectController::class, 'pin'])->name('projects.pin');
    Route::post('/projects/{project}/unpin', [ProjectController::class, 'unpin'])->name('projects.unpin');
    Route::post('/projects/{project}/mute', [ProjectController::class, 'mute'])->name('projects.mute');
    Route::post('/projects/{project}/unmute', [ProjectController::class, 'unmute'])->name('projects.unmute');
    Route::post('/projects/{project}/restore', [ProjectController::class, 'restore'])->name('projects.restore')->withTrashed();
    Route::delete('/projects/{project}/force-delete', [ProjectController::class, 'forceDeleteProject'])->name('projects.force-delete')->withTrashed();

    // Trash no longer has its own page - it's the Trash section of Settings
    // (see SettingsController::edit() + TrashSection.jsx). These action
    // endpoints stay as-is; only the GET listing route moved into Settings.
    Route::post('/trash/restore', [TrashController::class, 'restoreSelected'])->name('trash.restore-selected');
    Route::delete('/trash/force-delete', [TrashController::class, 'forceDeleteSelected'])->name('trash.force-delete-selected');
    Route::post('/trash/delete-existing', [TrashController::class, 'deleteExisting'])->name('trash.delete-existing');

    Route::patch('/tasks/{task}/resolve', [TaskController::class, 'resolvePending'])->name('tasks.resolve');
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::get('/testing', [TestingController::class, 'index'])->name('testing.index');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::patch('/tasks/{task}/start', [TaskController::class, 'start'])->name('tasks.start');
    Route::post('/tasks/{task}/submit', [TaskController::class, 'submit'])->name('tasks.submit');
    Route::patch('/tasks/{task}/start-review', [TaskController::class, 'startReview'])->name('tasks.start-review');
    Route::post('/tasks/{task}/review', [TaskController::class, 'review'])->name('tasks.review');
    Route::post('/tasks/{task}/pin', [TaskController::class, 'pin'])->name('tasks.pin');
    Route::post('/tasks/{task}/unpin', [TaskController::class, 'unpin'])->name('tasks.unpin');
    Route::post('/tasks/{task}/mute', [TaskController::class, 'mute'])->name('tasks.mute');
    Route::post('/tasks/{task}/unmute', [TaskController::class, 'unmute'])->name('tasks.unmute');
    Route::post('/tasks/{task}/reopen', [TaskController::class, 'reopen'])->name('tasks.reopen');
    Route::post('/tasks/{task}/restore', [TaskController::class, 'restore'])->name('tasks.restore')->withTrashed();
    Route::delete('/tasks/{task}/force-delete', [TaskController::class, 'forceDelete'])->name('tasks.force-delete')->withTrashed();
    Route::post('/tasks/{task}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::get('/tasks/{task}/download', [TaskController::class, 'downloadDeliverables'])->name('tasks.download')->withTrashed();
    Route::post('/tasks/{task}/checklist', [TaskChecklistItemController::class, 'store'])->name('checklist.store');
    Route::patch('/checklist/{checklistItem}', [TaskChecklistItemController::class, 'update'])->name('checklist.update');
    Route::delete('/checklist/{checklistItem}', [TaskChecklistItemController::class, 'destroy'])->name('checklist.destroy');
    Route::post('/checklist/{checklistItem}/add-to-notes', [TaskChecklistItemController::class, 'addToNotes'])->name('checklist.add-to-notes');
    Route::post('/tasks/{task}/dependencies', [TaskDependencyController::class, 'store'])->name('dependencies.store');
    Route::delete('/tasks/{task}/dependencies/{dependsOnTask}', [TaskDependencyController::class, 'destroy'])->name('dependencies.destroy');
    
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');
    Route::patch('/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');


    Route::get('/invitations/{token}', [InvitationController::class, 'show'])->name('invitations.show');
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'accept'])->name('invitations.accept');
    Route::post('/invitations/{token}/deny', [InvitationController::class, 'deny'])->name('invitations.deny');
    Route::delete('/invitations/{invitation}', [ProjectMemberController::class, 'destroyInvitation'])->name('projects.invitations.destroy');

    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('/notifications', [NotificationController::class, 'destroyAll'])->name('notifications.clear');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/users/search', [UserSearchController::class, 'search'])->name('users.search');
    Route::delete('/deliverables/{deliverable}', [TaskController::class, 'destroyDeliverable'])->name('deliverables.destroy');
    Route::post('/reminders', [ReminderController::class, 'store'])->name('reminders.store');
    Route::patch('/reminders/{reminder}', [ReminderController::class, 'update'])->name('reminders.update');
    Route::patch('/reminders/{reminder}/dismiss', [ReminderController::class, 'dismiss'])->name('reminders.dismiss');
    Route::delete('/reminders/{reminder}', [ReminderController::class, 'destroy'])->name('reminders.destroy');
    Route::post('/suspended-logout', [AuthenticatedSessionController::class, 'suspendedLogout'])->name('suspended-logout');
    Route::post('/password-reset-logout', [AuthenticatedSessionController::class, 'passwordResetLogout'])->name('password-reset-logout');


    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::get('/settings-settings', [SettingsController::class, 'edit']); // tolerate the redundant suffix too

    Route::match(['patch'], '/settings/email', [SettingsController::class, 'updateEmailPreferences'])->name('settings.email');
    Route::match(['patch'], '/settings/email-settings', [SettingsController::class, 'updateEmailPreferences'])->name('settings.email-settings');

    Route::match(['patch'], '/settings/notifications', [SettingsController::class, 'updateNotificationPreferences'])->name('settings.notifications');
    Route::match(['patch'], '/settings/notifications-settings', [SettingsController::class, 'updateNotificationPreferences'])->name('settings.notifications-settings');

    // "Logged in devices" section of Settings - see DeviceSessionsSection.jsx.
    Route::delete('/settings/devices/disconnect-others', [DeviceSessionController::class, 'disconnectOthers'])->name('settings.devices.disconnect-others');
    Route::delete('/settings/devices/{session}/disconnect', [DeviceSessionController::class, 'disconnect'])->name('settings.devices.disconnect');

    Route::get('/trusted-hosts', [TrustedHostController::class, 'index'])->name('trusted-hosts.index');
    Route::put('/trusted-hosts/{host}', [TrustedHostController::class, 'store'])->name('trusted-hosts.store');
    Route::delete('/trusted-hosts/{host}', [TrustedHostController::class, 'destroy'])->name('trusted-hosts.destroy');
    Route::delete('/trusted-hosts', [TrustedHostController::class, 'destroyAll'])->name('trusted-hosts.destroy-all');

});

Route::middleware(['auth', 'verified', 'password.change', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::post('/users/{user}/suspend', [AdminController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/lift-suspension', [AdminController::class, 'liftSuspension'])->name('users.lift-suspension');
    Route::middleware('superadmin')->group(function () {
        Route::patch('/users/{user}/toggle-role', [AdminController::class, 'toggleRole'])->name('users.toggle-role');
        Route::patch('/users/{user}/toggle-superadmin', [AdminController::class, 'toggleSuperAdmin'])->name('users.toggle-superadmin');
        Route::patch('/users/{user}', [AdminController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/bulk-delete', [AdminController::class, 'destroyBulk'])->name('users.destroy-bulk');
        Route::delete('/users/{user}', [AdminController::class, 'destroy'])->name('users.destroy');
    });
    Route::get('/projects', [AdminController::class, 'projects'])->name('projects');
    Route::delete('/projects/{project}', [AdminController::class, 'destroyProject'])->name('projects.destroy');
    Route::get('/feedbacks', [FeedbackAdminController::class, 'index'])->name('feedbacks');
    Route::patch('/feedbacks/{feedback}', [FeedbackAdminController::class, 'update'])->name('feedbacks.update');
    Route::post('/feedback-categories', [FeedbackCategoryController::class, 'store'])->name('feedback-categories.store');
    Route::patch('/feedback-categories/{feedbackCategory}', [FeedbackCategoryController::class, 'update'])->name('feedback-categories.update');
    Route::delete('/feedback-categories/{feedbackCategory}', [FeedbackCategoryController::class, 'destroy'])->name('feedback-categories.destroy');
    Route::get('/appeals', [AdminController::class, 'appeals'])->name('appeals');
    Route::patch('/appeals/{appeal}/respond', [AdminController::class, 'respondAppeal'])->name('appeals.respond');
    Route::patch('/appeals/{appeal}', [AdminController::class, 'reviewAppeal'])->name('appeals.review');
    Route::post('/users/{user}/reset-password', [AdminController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('/users/{user}/logs', [AdminController::class, 'userLogs'])->name('users.logs')->withTrashed();
    Route::get('/users/{user}/login-history', [AdminController::class, 'userLoginHistory'])->name('users.login-history')->withTrashed();
    Route::get('/projects/{project}/logs', [AdminController::class, 'projectLogs'])->name('projects.logs');
    Route::get('/suspension-logs', [AdminController::class, 'suspensionLogs'])->name('suspension-logs');
    Route::get('/logs', [AdminController::class, 'logs'])->name('logs');
    });

require __DIR__.'/auth.php';