import { usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';

const categoryMap = {
    task_assigned: 'assignments',
    task_unassigned: 'assignments',
    task_updated: 'assignments',
    task_deleted: 'assignments',
    task_approved: 'reviews',
    task_rejected: 'reviews',
    task_done: 'reviews',
    task_review_needed: 'reviews',
    member_left: 'membership',
    project_member_added: 'membership',
    project_role_changed: 'membership',
    reminder: 'reminders',
    removed_from_project: 'membership',
    project_invitation: 'membership',
    invitation_accepted: 'membership',
    invitation_denied: 'membership',
};

const typeStyles = {
    task_assigned: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        text: 'text-blue-600 dark:text-blue-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
    },
    task_approved: {
        bg: 'bg-green-100 dark:bg-green-900',
        text: 'text-green-600 dark:text-green-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    },
    task_rejected: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
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
    member_left: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
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
    reminder: {
        bg: 'bg-amber-100 dark:bg-amber-900',
        text: 'text-amber-600 dark:text-amber-300',
        icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
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
};

function relativeTime(dateString) {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
    const { auth, notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(notifications.recent);
    const [unreadCount, setUnreadCount] = useState(notifications.unreadCount);
    const [filter, setFilter] = useState('all');
    const [category, setCategory] = useState('all');
    const containerRef = useRef(null);

    useEffect(() => {
        setItems(notifications.recent);
        setUnreadCount(notifications.unreadCount);
    }, [notifications]);

    useEcho(
        `user.${auth.user.id}`,
        [
            '.task.assigned',
            '.task.reviewed',
            '.member.left',
            '.project.member-added',
            '.project.role-changed',
            '.task.done',
            '.task.review-needed',
            '.task.updated',
            '.task.unassigned',
            '.task.deleted',
            '.reminder.due',
            '.project.removed',
        ],
        (payload) => {
            let message;
            let url;
            let type = payload.type;

            if (payload.type === 'member_left') {
                message = `${payload.member_name} (${payload.role}) left "${payload.project_name}"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_member_added') {
                message = `You were added to "${payload.project_name}" as ${payload.role}`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_role_changed') {
                message = `Your role in "${payload.project_name}" changed from ${payload.old_role} to ${payload.new_role}`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'task_done') {
                message = `"${payload.title}" was marked done`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_review_needed') {
                message = `"${payload.title}" is waiting for your review`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_updated') {
                message = `Task "${payload.title}" was updated`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_unassigned') {
                message = `You were removed from task "${payload.title}"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.task_title !== undefined && payload.project_name !== undefined && payload.project_id !== undefined && payload.message) {
                // TaskDeleted event shape: { notification_id, task_title, project_name, project_id, message }
                type = 'task_deleted';
                message = payload.message;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'removed_from_project') {
                message = `You were removed from "${payload.project_name}"`;
                url = '/projects';
            } else if (payload.type === 'reminder') {
                message = `⏰ ${payload.title}${payload.note ? ' : ' + payload.note : ''}`;
                url = '/dashboard';
            } else if (payload.decision) {
                message = `"${payload.title}" was ${payload.decision === 'approve' ? 'approved' : 'sent back for changes'}${payload.feedback ? ': ' + payload.feedback : ''}`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else {
                message = `You were assigned a new task: "${payload.title}"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            }

            setItems((prev) => [
                {
                    id: payload.notification_id,
                    type,
                    message,
                    url,
                    read_at: null,
                    created_at: new Date().toISOString(),
                },
                ...prev.filter((n) => n.id !== payload.notification_id),
            ].slice(0, 10));
            setUnreadCount((c) => c + 1);
        },
        [auth.user.id],
    );

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const openNotification = (note) => {
        if (!note.read_at) {
            router.patch(route('notifications.read', note.id), {}, { preserveScroll: true, preserveState: true });
        }
        setUnreadCount((c) => Math.max(0, c - (note.read_at ? 0 : 1)));
        setOpen(false);
        if (note.url) router.visit(note.url);
    };

    const markAllRead = () => {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true, preserveState: true });
        setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        setUnreadCount(0);
    };

    const deleteNotification = (id) => {
        const note = items.find((n) => n.id === id);
        router.delete(route('notifications.destroy', id), { preserveScroll: true, preserveState: true });
        setItems((prev) => prev.filter((n) => n.id !== id));
        if (note && !note.read_at) {
            setUnreadCount((c) => Math.max(0, c - 1));
        }
    };

    const clearAll = () => {
        if (!confirm('Clear all notifications? This cannot be undone.')) return;
        router.delete(route('notifications.clear'), { preserveScroll: true, preserveState: true });
        setItems([]);
        setUnreadCount(0);
    };

    const visibleItems = items
        .filter((n) => (filter === 'unread' ? !n.read_at : true))
        .filter((n) => (category === 'all' ? true : categoryMap[n.type] === category));

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`relative rounded-md p-2 transition ${
                    unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</p>
                        <div className="flex gap-3">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                    Mark all read
                                </button>
                            )}
                            {items.length > 0 && (
                                <button onClick={clearAll} className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400">
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-2 dark:border-gray-700">
                        {['all', 'unread'].map((option) => (
                            <button
                                key={option}
                                onClick={() => setFilter(option)}
                                className={`rounded-md px-2 py-1 text-xs capitalize ${
                                    filter === option
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="ml-auto rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">All Categories</option>
                            <option value="assignments">Assignments</option>
                            <option value="reviews">Reviews</option>
                            <option value="membership">Membership</option>
                            <option value="reminders">Reminders</option>
                        </select>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {visibleItems.length === 0 && (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm text-gray-400 dark:text-gray-500">No matching notifications.</p>
                            </div>
                        )}
                        {visibleItems.map((note) => {
                            const style = typeStyles[note.type] ?? typeStyles.task_assigned;
                            return (
                                <div
                                    key={note.id}
                                    className={`flex items-start gap-2 border-b border-gray-50 px-4 py-3 dark:border-gray-700/50 ${
                                        !note.read_at ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                                    }`}
                                >
                                    <button onClick={() => openNotification(note)} className="flex flex-1 items-start gap-3 text-left">
                                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                {style.icon}
                                            </svg>
                                        </span>
                                        <span className="flex-1">
                                            <span className={`block text-sm ${!note.read_at ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {note.message}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                                                {relativeTime(note.created_at)}
                                            </span>
                                        </span>
                                        {!note.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                                    </button>
                                    <button
                                        onClick={() => deleteNotification(note.id)}
                                        title="Delete notification"
                                        className="mt-1 shrink-0 rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-red-500 dark:text-gray-600 dark:hover:bg-gray-700"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
