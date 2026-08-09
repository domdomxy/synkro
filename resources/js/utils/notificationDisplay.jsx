// Shared display data/helpers for notifications - used by both the
// NotificationBell dropdown (last 10, live-updating) and the full
// Notifications page (paginated, filterable). Kept in one place so a new
// notification type only needs its icon/category added once.

export const categoryMap = {
    task_assigned: 'assignments',
    task_unassigned: 'assignments',
    task_updated: 'assignments',
    task_deleted: 'assignments',
    task_restored: 'assignments',
    task_commented: 'assignments',
    task_mentioned: 'mentions',
    comment_replied: 'replies',
    task_checklist_item_added: 'assignments',
    task_checklist_item_updated: 'assignments',
    task_checklist_item_deleted: 'assignments',
    task_overdue: 'assignments',
    task_approved: 'reviews',
    task_rejected: 'reviews',
    task_reopened: 'reviews',
    task_done: 'reviews',
    task_review_needed: 'reviews',
    member_left: 'membership',
    member_name_changed: 'membership',
    owner_account_deleted: 'membership',
    project_member_added: 'membership',
    project_role_changed: 'membership',
    project_updated: 'membership',
    project_ownership_transferred: 'membership',
    project_deleted: 'membership',
    project_restored: 'membership',
    reminder: 'reminders',
    removed_from_project: 'membership',
    project_invitation: 'membership',
    invitation_accepted: 'membership',
    invitation_denied: 'membership',
    feedback_replied: 'administration',
    admin_status_changed: 'administration',
    ticket_created: 'administration',
    appeal_created: 'administration',
};

export const typeStyles = {
    task_assigned: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    },
    task_commented: {
        bg: 'bg-sky-100 dark:bg-sky-900',
        text: 'text-sky-600 dark:text-sky-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    },
    task_mentioned: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v5a3 3 0 006 0v-1a9 9 0 10-3.6 7.2M16 8v5a3 3 0 01-6 0V8a3 3 0 016 0z" />,
    },
    comment_replied: {
        bg: 'bg-sky-100 dark:bg-sky-900',
        text: 'text-sky-600 dark:text-sky-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17L4 12m0 0l5-5m-5 5h11a4 4 0 004-4V7" />,
    },
    task_checklist_item_added: {
        bg: 'bg-teal-100 dark:bg-teal-900',
        text: 'text-teal-600 dark:text-teal-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 9l2 2 4-4" />,
    },
    task_checklist_item_updated: {
        bg: 'bg-teal-100 dark:bg-teal-900',
        text: 'text-teal-600 dark:text-teal-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    },
    task_checklist_item_deleted: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    },
    task_approved: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    },
    task_overdue: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    },
    task_rejected: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    },
    task_reopened: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    task_done: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    task_review_needed: {
        bg: 'bg-purple-100 dark:bg-purple-900',
        text: 'text-purple-600 dark:text-purple-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l5.5 5.5M10 17a7 7 0 100-14 7 7 0 000 14z" />,
    },
    task_updated: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    },
    task_unassigned: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />,
    },
    task_deleted: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    },
    task_restored: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    },
    member_left: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    member_name_changed: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM19 8l2 2-2 2m2-2h-6" />,
    },
    owner_account_deleted: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    project_member_added: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    },
    project_role_changed: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />,
    },
    project_updated: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    },
    project_ownership_transferred: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />,
    },
    project_deleted: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    },
    project_restored: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    },
    reminder: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    feedback_replied: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    },
        removed_from_project: {
        bg: 'bg-red-100 dark:bg-red-900',
        text: 'text-red-600 dark:text-red-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />,
    },
    project_invitation: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    },
    invitation_accepted: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    },
    invitation_denied: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    },
    admin_status_changed: {
        bg: 'bg-purple-100 dark:bg-purple-900',
        text: 'text-purple-600 dark:text-purple-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    },
    ticket_created: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    },
    appeal_created: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
    },
    password_changed: {
        bg: 'bg-slate-100 dark:bg-slate-700',
        text: 'text-slate-600 dark:text-slate-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    },
    email_changed: {
        bg: 'bg-slate-100 dark:bg-slate-700',
        text: 'text-slate-600 dark:text-slate-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    },
    account_restored: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    },
    ticket_status_changed: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    },
    ticket_responded: {
        bg: 'bg-indigo-100 dark:bg-indigo-900',
        text: 'text-indigo-600 dark:text-indigo-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    },
};

export function relativeTime(dateString) {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function splitMessage(message) {
    const idx = message.indexOf('\n');
    if (idx === -1) return { title: message, description: null };
    return { title: message.slice(0, idx), description: message.slice(idx + 1) };
}
