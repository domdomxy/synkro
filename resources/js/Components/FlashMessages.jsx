import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import useToastStack from '@/hooks/useToastStack';

// Same visual language as NotificationToast (see that file for the black-theme
// glow rules in black-theme.css, keyed off `.notification-toast[data-toast-type]`
// which this component reuses).
const FLASH_STYLES = {
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
};

// Newest toast lands nearest the entry edge (top on mobile, bottom on
// desktop); older ones get pushed away from it as new ones arrive, and the
// oldest is dropped once a 4th would otherwise show.
const MAX_FLASH_TOASTS = 3;

export default function FlashMessages() {
    const { flash, errors } = usePage().props;
    const { toasts, push, dismiss } = useToastStack(MAX_FLASH_TOASTS);

    useEffect(() => {
        if (flash?.success) {
            push({ type: 'success', text: flash.success });
        } else if (errors?.error) {
            push({ type: 'error', text: errors.error });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash, errors]);

    if (toasts.length === 0) return null;

    const enterAnim = 'animate-toast-drop-mobile sm:animate-toast-slide-desktop';
    const exitAnim = 'animate-toast-lift-mobile sm:animate-toast-slide-out-desktop';

    return (
        <div className="fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col-reverse gap-2 sm:left-auto sm:right-4 sm:top-auto sm:bottom-4 sm:w-auto sm:max-w-sm sm:translate-x-0 sm:flex-col">
            {toasts.map((message) => {
                const style = FLASH_STYLES[message.type] ?? FLASH_STYLES.success;
                const anim = message.leaving ? exitAnim : enterAnim;

                return (
                    <div
                        key={message.id}
                        data-toast-type={message.type}
                        className={`notification-toast ${anim} relative flex w-full items-center gap-3 overflow-hidden rounded-lg border py-3 pl-3 pr-3 text-sm shadow-lg sm:pr-9 ${style.card}`}
                    >
                        <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden="true" />

                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={style.path} />
                            </svg>
                        </span>

                        <span className="text-gray-700 dark:text-gray-200">{message.text}</span>

                        {/* Mobile clears itself after 2s, so there's nothing to dismiss by
                            hand there - the close button only shows from sm: up. */}
                        <button
                            type="button"
                            onClick={() => dismiss(message.id)}
                            aria-label="Dismiss notification"
                            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200 sm:block"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
