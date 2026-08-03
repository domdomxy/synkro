import { useCallback, useEffect, useRef, useState } from 'react';

// Matches the CSS animation duration in tailwind.config.js so a toast is
// only unmounted once its exit animation has actually finished playing.
const EXIT_DURATION = 250;

// Shared across every hook instance (FlashMessages, NotificationToast, ...)
// so ids never collide between the two stacks even though each keeps its
// own independent list of toasts.
let nextToastId = 0;

/**
 * Keeps a capped, ordered list of toasts (oldest first) for a stacking
 * toast UI. push() adds a new toast to the end of the list; once the list
 * would exceed maxToasts, the oldest one plays its exit animation and is
 * removed instead of just being silently dropped. dismiss() does the same
 * for a specific toast, e.g. from its own close button or an auto-dismiss
 * timer.
 */
export default function useToastStack(maxToasts = 3) {
    const [toasts, setToasts] = useState([]); // [{ id, leaving, ...whatever push() was given }]
    // Per-toast-id timers, keyed the same as the toast itself so a manual
    // dismiss can cancel a still-pending auto-dismiss timer and vice versa.
    const timers = useRef({});

    const clearToastTimers = useCallback((id) => {
        const t = timers.current[id];
        if (!t) return;
        clearTimeout(t.auto);
        clearTimeout(t.exit);
        delete timers.current[id];
    }, []);

    const remove = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        clearToastTimers(id);
    }, [clearToastTimers]);

    const dismiss = useCallback((id) => {
        setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
        const t = timers.current[id] ?? (timers.current[id] = {});
        clearTimeout(t.auto);
        t.exit = setTimeout(() => remove(id), EXIT_DURATION);
    }, [remove]);

    // Toasts stick on every screen size now - they stay put until the user
    // dismisses them by hand via the close button, or get pushed out once
    // the stack exceeds maxToasts.
    const push = useCallback((toast) => {
        const id = ++nextToastId;

        setToasts((current) => {
            const next = [...current, { ...toast, id, leaving: false }];
            if (next.length <= maxToasts) return next;

            // Cap exceeded - the oldest (front of the stack) starts its
            // exit animation immediately instead of just vanishing.
            const [oldest, ...rest] = next;
            const t = timers.current[oldest.id] ?? (timers.current[oldest.id] = {});
            clearTimeout(t.auto);
            t.exit = setTimeout(() => remove(oldest.id), EXIT_DURATION);
            return [{ ...oldest, leaving: true }, ...rest];
        });

        return id;
    }, [maxToasts, remove]);

    useEffect(() => () => {
        Object.values(timers.current).forEach((t) => {
            clearTimeout(t.auto);
            clearTimeout(t.exit);
        });
    }, []);

    return { toasts, push, dismiss };
}
