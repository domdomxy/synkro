import { usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useRef, useState } from 'react';
import useConfirm from '@/hooks/useConfirm';
import { NoteList } from '@/utils/noteFormat';
import FilterSelect from '@/Components/FilterSelect';
import { categoryMap, typeStyles, relativeTime, splitMessage } from '@/utils/notificationDisplay';
import NotificationIcon from '@/Components/NotificationIcon';
import useTabBadge from '@/hooks/useTabBadge';

export default function NotificationBell() {
    const { auth, notifications } = usePage().props;
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState(notifications.recent);
    const [unreadCount, setUnreadCount] = useState(notifications.unreadCount);
    const [filter, setFilter] = useState('all');
    const [category, setCategory] = useState('all');
    const containerRef = useRef(null);
    const { confirm, ConfirmDialog } = useConfirm();

    useEffect(() => {
        setItems(notifications.recent);
        setUnreadCount(notifications.unreadCount);
    }, [notifications]);

    // Surfaces unread activity on the browser tab itself (title prefix +
    // favicon counter), so it stays visible even when this dropdown is
    // closed or the tab is in the background.
    useTabBadge(unreadCount);

    useEcho(
        `user.${auth.user.id}`,
        [
            '.task.assigned',
            '.task.reviewed',
            '.task.commented',
            '.task.mentioned',
            '.comment.replied',
            '.task.checklist-item-added',
            '.task.checklist-item-updated',
            '.task.checklist-item-deleted',
            '.task.reopened',
            '.member.left',
            '.owner.account-deleted',
            '.project.invitation',
            '.invitation.accepted',
            '.invitation.denied',
            '.project.role-changed',
            '.project.member-added',
            '.project.updated',
            '.project.ownership-transferred',
            '.project.deleted',
            '.task.done',
            '.task.review-needed',
            '.task.overdue',
            '.task.updated',
            '.task.unassigned',
            '.task.deleted',
            '.reminder.due',
            '.project.removed',
            '.feedback.replied',
            '.admin.status-changed',
            '.ticket.created',
            '.appeal.created',
            '.password.changed',
            '.email.changed',
            '.ticket.status-changed',
            '.ticket.responded',
            '.appeal.responded',
            '.appeal.auto-closed',
        ],
        (payload) => {
            let message;
            let url;
            let type = payload.type;

            if (payload.type === 'member_left') {
                message = `Member left\n**${payload.member_name}** (${payload.role}) left "**${payload.project_name}**"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'owner_account_deleted') {
                const restoreBy = new Date(payload.restore_by).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                message = `Owner account deleted\n**${payload.owner_name}**, the owner of "**${payload.project_name}**", deleted their account. Restorable until the end of ${restoreBy}.`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_invitation') {
                message = `Project invitation\n**${payload.inviter_name}** invited you to join "**${payload.project_name}**" as ${payload.role}`;
                url = `/invitations/${payload.token}`;
            } else if (payload.type === 'invitation_accepted') {
                message = `Invitation accepted\n**${payload.accepted_by}** accepted your invitation to "**${payload.project_name}**"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'invitation_denied') {
                message = `Invitation declined\n**${payload.denied_by}** declined your invitation to "**${payload.project_name}**"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_role_changed') {
                message = `Role changed\nYour role in "**${payload.project_name}**" changed from ${payload.old_role} to ${payload.new_role}`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_member_added') {
                message = `New member\n**${payload.member_name ?? 'Someone'}** joined "**${payload.project_name}**" as ${payload.role}`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_updated') {
                message = `Project updated\n"**${payload.project_name}**" was edited`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_ownership_transferred') {
                message = `Ownership transferred\nYou now own "**${payload.project_name}**"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'project_deleted') {
                message = `Project deleted\n"**${payload.project_name}**" was deleted`;
                url = '/projects';
            } else if (payload.type === 'task_reopened') {
                message = `Task reopened\n"**${payload.title}**" was reopened for changes${payload.feedback ? ': ' + payload.feedback : ''}`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_done') {
                message = `Task completed\n"**${payload.title}**" was marked done`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_review_needed') {
                message = `Review needed\n"**${payload.title}**" is waiting for your review`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_overdue') {
                message = `Task overdue\n"**${payload.title}**" is past its due date`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else if (payload.type === 'task_updated') {
                message = `Task updated\nTask "**${payload.title}**" was updated`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}&history=1`;
            } else if (payload.type === 'task_unassigned') {
                message = `Removed from task\nYou were removed from task "**${payload.title}**"`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'task_commented') {
                message = `New comment\n**${payload.commenter_name}** commented on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}` + (payload.comment_id ? `&comment=${payload.comment_id}` : '');
            } else if (payload.type === 'task_mentioned') {
                message = `You were mentioned\n**${payload.commenter_name}** mentioned you on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}` + (payload.comment_id ? `&comment=${payload.comment_id}` : '');
            } else if (payload.type === 'comment_replied') {
                message = `New reply\n**${payload.commenter_name}** replied to your comment on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}` + (payload.comment_id ? `&comment=${payload.comment_id}` : '');
            } else if (payload.type === 'task_checklist_item_added') {
                message = `New checklist item\n**${payload.added_by_name ?? 'Someone'}** added "${payload.item_title}" to the checklist on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}&checklist=1`;
            } else if (payload.type === 'task_checklist_item_updated') {
                message = `Checklist item edited\n**${payload.editor_name ?? 'Someone'}** edited "${payload.old_item_title}" to "${payload.new_item_title}" on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}&checklist=1`;
            } else if (payload.type === 'task_checklist_item_deleted') {
                message = `Checklist item removed\n**${payload.deleted_by_name ?? 'Someone'}** removed "${payload.item_title}" from the checklist on "**${payload.title}**"`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}&checklist=1`;
            } else if (payload.task_title !== undefined && payload.project_name !== undefined && payload.project_id !== undefined && payload.message) {
                // TaskDeleted event shape: { notification_id, task_title, project_name, project_id, message }
                type = 'task_deleted';
                message = payload.message.includes('\n') ? payload.message : `Task deleted\n${payload.message}`;
                url = `/projects/${payload.project_id}`;
            } else if (payload.type === 'removed_from_project') {
                message = `Removed from project\nYou were removed from "**${payload.project_name}**"`;
                url = '/projects';
            } else if (payload.type === 'reminder') {
                message = payload.note ? `${payload.title}\n${payload.note}` : payload.title;
                url = payload.repeating && payload.reminder_id ? `/dashboard?reminder=${payload.reminder_id}` : '/dashboard';
            } else if (payload.type === 'feedback_replied') {
                message = `Feedback reply\n**${payload.submitter_name}** replied to ticket "**${payload.subject}**"`;
                url = '/admin/feedbacks';
            } else if (payload.type === 'admin_status_changed') {
                message = payload.new_role === 'admin'
                    ? 'Promoted to admin\nYou were granted administrator access on Synkro.'
                    : payload.new_role === 'superadmin'
                        ? 'Promoted to superadmin\nYou were granted superadmin access on Synkro.'
                        : 'Removed from admin\nYour administrator access on Synkro was removed.';
                url = payload.new_role === 'admin' || payload.new_role === 'superadmin' ? '/admin' : '/dashboard';
            } else if (payload.type === 'ticket_created') {
                message = `New ticket submitted\n**${payload.submitter_name}** submitted a new ticket "**${payload.subject}**"`;
                url = '/admin/feedbacks';
            } else if (payload.type === 'appeal_created') {
                message = `New appeal submitted\n**${payload.user_name}** submitted a suspension appeal`;
                url = '/admin/appeals';
            } else if (payload.type === 'password_changed') {
                message = "Password changed\nYour account password was changed. If this wasn't you, contact support immediately.";
                url = '/account';
            } else if (payload.type === 'email_changed') {
                message = `Email address changed\nYour account email is now **${payload.new_email}**.`;
                url = '/account';
            } else if (payload.type === 'ticket_status_changed') {
                message = `Ticket updated\nYour ticket "**${payload.subject}**" (${payload.tracking_id}) status changed to **${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}**`;
                url = '/feedback';
            } else if (payload.type === 'ticket_responded') {
                message = `Support replied\nSupport responded to your ticket "**${payload.subject}**" (${payload.tracking_id})`;
                url = '/feedback';
            } else if (payload.type === 'appeal_responded') {
                message = 'Update on your appeal\nA member of our support team left a note on your suspension appeal.';
                url = '/login';
            } else if (payload.type === 'appeal_auto_closed') {
                message = 'Appeal closed\nYour suspension appeal was automatically closed after 24h of inactivity.';
                url = '/login';
            } else if (payload.decision) {
                const decisionTitle = payload.decision === 'approve' ? 'Task approved' : 'Changes requested';
                message = `${decisionTitle}\n"**${payload.title}**" was ${payload.decision === 'approve' ? 'approved' : 'sent back for changes'}${payload.feedback ? ': ' + payload.feedback : ''}`;
                url = `/projects/${payload.project_id}?task=${payload.task_id}`;
            } else {
                message = `Task assigned\nYou were assigned a new task: "**${payload.title}**"`;
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
        router.delete(route('notifications.destroy', id), { preserveScroll: true, preserveState: true, only: ['notifications'] });
        setItems((prev) => prev.filter((n) => n.id !== id));
        if (note && !note.read_at) {
            setUnreadCount((c) => Math.max(0, c - 1));
        }
    };

    const clearAll = async () => {
        if (!(await confirm('This cannot be undone.', { title: 'Clear All Notifications?', danger: true, confirmLabel: 'Clear All' }))) return;
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
                <div className="absolute -right-10 z-50 mt-2 w-96 max-w-[calc(100vw-1rem)] rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700 sm:right-0">
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
                        <FilterSelect
                            value={category}
                            onChange={setCategory}
                            className="ml-auto w-40"
                            buttonClassName="py-1 text-xs"
                            options={[
                                { value: 'all', label: 'All Categories' },
                                { value: 'assignments', label: 'Assignments' },
                                { value: 'reviews', label: 'Reviews' },
                                { value: 'membership', label: 'Membership' },
                                { value: 'replies', label: 'Replies' },
                                { value: 'reminders', label: 'Reminders' },
                                ...(auth.user.role === 'admin' || auth.user.role === 'superadmin' ? [{ value: 'administration', label: 'Administration' }] : []),
                            ]}
                        />
                    </div>

                    <div className="max-h-96 overflow-y-auto rounded-b-lg">
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
                            const { title, description } = splitMessage(note.message);
                            return (
                                <div
                                    key={note.id}
                                    className={`group flex items-start gap-2 border-b border-gray-50 px-4 py-3 transition hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30 ${
                                        !note.read_at ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                                    }`}
                                >
                                    <button onClick={() => openNotification(note)} className="flex flex-1 items-start gap-3 text-left">
                                        <NotificationIcon causer={note.causer} style={style} size="h-8 w-8" />
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-sm ${!note.read_at ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                {title}
                                            </span>
                                            {description && (
                                                <NoteList
                                                    note={description}
                                                    className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                                                />
                                            )}
                                            <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
                                                {relativeTime(note.created_at)}
                                            </span>
                                        </span>
                                        {!note.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteNotification(note.id);
                                        }}
                                        title="Delete notification"
                                        className="mt-1 shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-2 text-center dark:border-gray-700">
                        <a
                            href={route('notifications.index')}
                            onClick={() => setOpen(false)}
                            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            View all notifications
                        </a>
                    </div>
                </div>
            )}
            {ConfirmDialog}
        </div>
    );
}
