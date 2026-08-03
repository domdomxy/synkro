import { useEcho } from '@laravel/echo-react';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
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
function toastFromPayload(payload) {
    switch (payload.type) {
        case 'task_approved':
            return {
                type: 'success',
                message: `"**${payload.title}**" was approved${payload.feedback ? ': ' + payload.feedback : ''}`,
            };
        case 'task_rejected':
            return {
                type: 'error',
                message: `"**${payload.title}**" was sent back for changes${payload.feedback ? ': ' + payload.feedback : ''}`,
            };
        case 'task_assigned':
            return { type: 'info', message: `You were assigned a new task: "**${payload.title}**"` };
        case 'task_updated':
            return { type: 'info', message: `"**${payload.title}**" was updated` };
        default:
            return { type: 'error', message: payload.message ?? `"**${payload.task_title}**" was deleted` };
    }
}

// Matches the CSS animation duration below so the toast is only unmounted
// once the exit animation has actually finished playing.
const EXIT_DURATION = 250;

export default function NotificationToast() {
    const { auth } = usePage().props;
    const [toast, setToast] = useState(null); // { type: 'success'|'error'|'info', message }
    const [leaving, setLeaving] = useState(false);
    const exitTimer = useRef(null);

    useEcho(
        `user.${auth.user.id}`,
        ['.task.assigned', '.task.reviewed', '.task.updated', '.task.deleted'],
        (payload) => {
            clearTimeout(exitTimer.current);
            setLeaving(false);
            setToast(toastFromPayload(payload));
        },
        [auth.user.id],
    );

    // Dismissing plays the mobile "lift back up" / desktop "slide back out"
    // animation before actually unmounting, instead of just vanishing.
    const dismiss = () => {
        setLeaving(true);
        exitTimer.current = setTimeout(() => {
            setToast(null);
            setLeaving(false);
        }, EXIT_DURATION);
    };

    // Auto-dismiss only applies on mobile, where the toast drops from the top
    // and clears itself after 2s. On larger screens it stays put until the
    // person dismisses it with the close button.
    useEffect(() => {
        if (!toast) return;
        const isMobile = window.matchMedia('(max-width: 639px)').matches;
        if (!isMobile) return;
        const timer = setTimeout(dismiss, 2000);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => () => clearTimeout(exitTimer.current), []);

    if (!toast) return null;

    const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info;
    const enterAnim = 'animate-toast-drop-mobile sm:animate-toast-slide-desktop';
    const exitAnim = 'animate-toast-lift-mobile sm:animate-toast-slide-out-desktop';

    return (
        <div
            data-toast-type={toast.type}
            className={`notification-toast ${leaving ? exitAnim : enterAnim} fixed left-1/2 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 overflow-hidden rounded-lg border py-3 pl-3 pr-3 text-sm shadow-lg sm:left-auto sm:right-4 sm:top-auto sm:bottom-4 sm:w-auto sm:max-w-sm sm:translate-x-0 sm:pr-9 ${style.card}`}
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

            {/* Mobile clears itself after 2s, so there's nothing to dismiss by
                hand there - the close button only shows from sm: up. */}
            <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss notification"
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200 sm:block"
            >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
