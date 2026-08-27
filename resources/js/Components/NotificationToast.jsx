import { useEcho } from '@laravel/echo-react';
import { usePage, router } from '@inertiajs/react';
import useToastStack from '@/hooks/useToastStack';
import { noteBoldSegments } from '../utils/noteFormat';

// Visual treatment per notification outcome. Colors are drawn from shades
// already remapped in black-theme.css (green-900/red-900/indigo-900 family)
// so the true-black theme gets its own tuned palette for free, on top of the
// dedicated glow added in black-theme.css for `.notification-toast`.
const TOAST_STYLES = {
    success: {
        card: 'border-green-300 bg-white dark:border-green-900 dark:bg-gray-900',
        accent: 'bg-green-500',
        iconWrap: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
        path: 'M4.5 12.75l6 6 9-13.5',
    },
    error: {
        card: 'border-red-300 bg-white dark:border-red-900 dark:bg-gray-900',
        accent: 'bg-red-500',
        iconWrap: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
        path: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    info: {
        card: 'border-indigo-300 bg-white dark:border-indigo-900 dark:bg-gray-900',
        accent: 'bg-indigo-500',
        iconWrap: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
        path: 'M12 9v3.75m0 3.75h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
};

// Maps a broadcast payload to a toast. task.assigned/reviewed/updated all carry
// a `type` field (task_assigned / task_approved / task_rejected / task_updated);
// task.deleted doesn't (see TaskDeleted::broadcastWith) but ships a ready-made,
// already-bold-formatted `message` instead.
//
// Each toast also carries a `url` and `notificationId` (mirroring the same
// payload fields NotificationBell already builds its own urls from) so
// clicking the toast can navigate to the same destination and mark the same
// underlying notification read - see openToast() below.
function toastFromPayload(payload) {
    const notificationId = payload.notification_id;
    switch (payload.type) {
        case 'task_approved':
            return {
                type: 'success',
                message: `"**${payload.title}**" was approved${payload.feedback ? ': ' + payload.feedback : ''}`,
                url: `/projects/${payload.project_id}?task=${payload.task_id}`,
                notificationId,
            };
        case 'task_rejected':
            return {
                type: 'error',
                message: `"**${payload.title}**" was sent back for changes${payload.feedback ? ': ' + payload.feedback : ''}`,
                url: `/projects/${payload.project_id}?task=${payload.task_id}`,
                notificationId,
            };
        case 'task_assigned':
            return {
                type: 'info',
                message: `You were assigned a new task: "**${payload.title}**"`,
                url: `/projects/${payload.project_id}?task=${payload.task_id}`,
                notificationId,
            };
        case 'task_updated':
            return {
                type: 'info',
                message: `"**${payload.title}**" was updated`,
                url: `/projects/${payload.project_id}?task=${payload.task_id}&history=1`,
                notificationId,
            };
        default:
            return {
                type: 'error',
                message: payload.message ?? `"**${payload.task_title}**" was deleted`,
                url: payload.project_id !== undefined ? `/projects/${payload.project_id}` : null,
                notificationId,
            };
    }
}

// Newest toast lands nearest the bottom entry edge on both mobile and
// desktop; older ones get pushed away from it as new ones arrive, and the
// oldest is dropped once a 4th would otherwise show.
const MAX_NOTIFICATION_TOASTS = 3;

export default function NotificationToast() {
    const { auth } = usePage().props;
    const { toasts, push, dismiss } = useToastStack(MAX_NOTIFICATION_TOASTS);

    useEcho(
        `user.${auth.user.id}`,
        ['.task.assigned', '.task.reviewed', '.task.updated', '.task.deleted'],
        (payload) => push(toastFromPayload(payload)),
        [auth.user.id],
    );

    if (toasts.length === 0) return null;

    const enterAnim = 'animate-toast-drop-mobile sm:animate-toast-slide-desktop';
    const exitAnim = 'animate-toast-lift-mobile sm:animate-toast-slide-out-desktop';

    // Same two steps NotificationBell's openNotification() does for a bell row: mark the
    // underlying notification read (if it has one to mark - not every toast maps to a stored
    // notification), then navigate. Dismissing the toast itself is left to the caller, same as
    // the bell closes its own dropdown separately from this.
    const openToast = (toast) => {
        if (!toast.url) return;
        if (toast.notificationId) {
            router.patch(route('notifications.read', toast.notificationId), {}, { preserveScroll: true, preserveState: true });
        }
        router.visit(toast.url);
    };

    // No outer `fixed` wrapper here: this renders inside the shared <ToastLayer>
    // alongside FlashMessages' list, so both sources stack in one column instead
    // of each anchoring to bottom-right independently and overlapping.
    return (
        <>
            {toasts.map((toast) => {
                const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info;
                const anim = toast.leaving ? exitAnim : enterAnim;

                return (
                    <div
                        key={toast.id}
                        data-toast-type={toast.type}
                        role={toast.url ? 'button' : undefined}
                        tabIndex={toast.url ? 0 : undefined}
                        onClick={() => openToast(toast)}
                        onKeyDown={(e) => {
                            if (toast.url && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                openToast(toast);
                            }
                        }}
                        className={`notification-toast ${anim} relative flex w-full items-center gap-3 overflow-hidden rounded-lg border py-3 pl-3 pr-9 text-sm shadow-lg ${style.card} ${toast.url ? 'cursor-pointer' : ''}`}
                    >
                        <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden="true" />

                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                            </svg>
                        </span>

                        <span className="text-gray-700 dark:text-gray-200">
                            {noteBoldSegments(toast.message, 'font-semibold text-gray-900 dark:text-white')}
                        </span>

                        <button
                            type="button"
                            onClick={(e) => {
                                // The dismiss button sits inside the now-clickable card, so its
                                // click must not also bubble up and trigger openToast() above.
                                e.stopPropagation();
                                dismiss(toast.id);
                            }}
                            aria-label="Dismiss notification"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </>
    );
}
