import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Keeps an absolutely-positioned floating panel (a dropdown menu, a select's
 * options list, etc.) fully inside the horizontal viewport.
 *
 * Anchoring a panel to its trigger's left or right edge only works for one
 * screen width and one trigger position. A "Filters" button sitting in the
 * middle of a toolbar, for instance, can still open a panel that runs off
 * either edge once the viewport narrows enough — flipping which corner it's
 * anchored to just moves the same problem to the other side. Instead, this
 * measures the panel after it renders and nudges it back on screen with a
 * transform, the same corrective behavior a native <select> gets for free.
 *
 * Re-measures on window resize AND whenever the panel's own size changes
 * (via ResizeObserver) — a panel can grow after it's already open and
 * already positioned, e.g. a "Custom" toggle inside it revealing date
 * inputs, and that growth needs to re-trigger the same clamping, not just
 * the initial open.
 *
 * Usage: attach `ref` to the floating panel element and spread `style` onto
 * it. Pass the menu's open/visible boolean so it only measures while shown.
 */
export default function useViewportClamp(open) {
    const ref = useRef(null);
    const [offset, setOffset] = useState(0);

    useLayoutEffect(() => {
        if (!open) {
            setOffset(0);
            return;
        }

        const recalc = () => {
            const el = ref.current;
            if (!el) return;
            const margin = 8;
            const rect = el.getBoundingClientRect();

            setOffset((prev) => {
                if (rect.right > window.innerWidth - margin) {
                    return prev - (rect.right - (window.innerWidth - margin));
                }
                if (rect.left < margin) {
                    return prev + (margin - rect.left);
                }
                return prev;
            });
        };

        recalc();
        window.addEventListener('resize', recalc);

        let resizeObserver;
        if (ref.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(recalc);
            resizeObserver.observe(ref.current);
        }

        return () => {
            window.removeEventListener('resize', recalc);
            resizeObserver?.disconnect();
        };
    }, [open]);

    return {
        ref,
        style: offset ? { transform: `translateX(${offset}px)` } : undefined,
    };
}
