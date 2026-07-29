<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    // Mirrors resources/js/utils/notificationDisplay.js's categoryMap - kept
    // in sync manually since one lives in PHP (for server-side filtering on
    // this paginated page) and the other in JS (for display/icons). A type
    // missing from this map simply can't be filtered by category here.
    private const CATEGORY_TYPES = [
        'assignments' => ['task_assigned', 'task_unassigned', 'task_updated', 'task_deleted', 'task_commented', 'task_overdue'],
        'mentions' => ['task_mentioned'],
        'replies' => ['comment_replied'],
        'reviews' => ['task_approved', 'task_rejected', 'task_reopened', 'task_done', 'task_review_needed'],
        'membership' => [
            'member_left', 'project_member_added', 'project_role_changed', 'project_updated',
            'project_ownership_transferred', 'project_deleted', 'removed_from_project',
            'project_invitation', 'invitation_accepted', 'invitation_denied',
        ],
        'reminders' => ['reminder'],
        'administration' => ['feedback_replied', 'admin_status_changed', 'ticket_created', 'appeal_created'],
    ];

    public function index(Request $request)
    {
        $filter = $request->input('filter', 'all');
        $category = $request->input('category', 'all');

        $query = $request->user()->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        if ($category !== 'all' && isset(self::CATEGORY_TYPES[$category])) {
            $query->whereIn('type', self::CATEGORY_TYPES[$category]);
        }

        $notifications = $query->paginate($this->perPage($request, 10))->withQueryString();

        return Inertia::render('Notifications', [
            'notifications' => $notifications,
            'filters' => [
                'filter' => $filter,
                'category' => $category,
                'per_page' => $request->input('per_page'),
            ],
        ]);
    }

    private function perPage(Request $request, int $default): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return max(1, min($perPage, 500));
    }

    public function markRead(UserNotification $notification)
    {
        abort_unless($notification->user_id === Auth::id(), 403);

        $notification->update(['read_at' => now()]);

        return back();
    }

    public function markAllRead()
    {
        Auth::user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return back();
    }
    public function destroy(UserNotification $notification)
    {
        abort_unless($notification->user_id === Auth::id(), 403);

        $notification->delete();

        return back();
    }

    public function destroyAll()
    {
        Auth::user()->notifications()->delete();

        return back();
    }
}