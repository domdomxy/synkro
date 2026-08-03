import { useEffect } from 'react';

// Kanban columns need real width to be usable, and portrait phones don't
// have it - this rotates the screen to landscape for the duration of the
// Board modal and rotates it back the moment it closes.
//
// screen.orientation.lock() is gated behind a real mobile browser (desktop
// Chrome/Firefox reject it outright) and, on most of those, behind the
// document being in fullscreen first - locking without it throws
// SecurityError. Both are normal, expected outcomes here (desktop users get
// plenty of width without rotating, and a browser that refuses fullscreen
// just keeps its current orientation), so failures are swallowed rather
// than surfaced.
const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 639px)').matches;

export default function useLandscapeOnOpen(open) {
    useEffect(() => {
        if (!open || !isMobileViewport()) {
            return;
        }

        const orientation = typeof screen !== 'undefined' ? screen.orientation : null;
        let enteredFullscreen = false;

        const lock = async () => {
            if (!orientation?.lock) return;

            try {
                await orientation.lock('landscape');
            } catch {
                // Most mobile browsers only allow locking while in
                // fullscreen - request it once, then retry the lock.
                try {
                    const el = document.documentElement;
                    if (el.requestFullscreen) {
                        await el.requestFullscreen();
                        enteredFullscreen = true;
                        await orientation.lock('landscape');
                    }
                } catch {
                    // Not supported on this browser/OS (iOS Safari, most
                    // desktop browsers). Nothing more we can do here.
                }
            }
        };

        lock();

        return () => {
            try {
                orientation?.unlock?.();
            } catch {
                // no-op
            }

            if (enteredFullscreen && document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        };
    }, [open]);
}
