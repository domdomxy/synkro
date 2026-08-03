import { useEffect, useRef } from 'react';
import { setFaviconBadgeCount } from '@/theme';

// Matches a previously-applied "(3) " / "(9+) " prefix so it can be stripped
// back out before recomputing, regardless of who last touched the title.
const BADGE_PATTERN = /^\(\d+\+?\) /;

/**
 * Badges the browser tab with the given count, the same way most inbox-style
 * apps (Gmail, Slack) surface unread activity to a backgrounded tab: a
 * "(N) " prefix on the title, plus a red counter drawn onto the favicon.
 *
 * Inertia's own <Head> sets document.title fresh on every page visit, which
 * would otherwise wipe our prefix off on navigation. A MutationObserver on
 * the <title> node lets us reapply the badge immediately after Inertia (or
 * anything else) changes it, instead of racing it.
 */
export default function useTabBadge(count) {
    const countRef = useRef(count);
    countRef.current = count;

    useEffect(() => {
        const applyBadge = () => {
            const base = document.title.replace(BADGE_PATTERN, '');
            const badged = countRef.current > 0
                ? `(${countRef.current > 99 ? '99+' : countRef.current}) ${base}`
                : base;
            if (document.title !== badged) document.title = badged;
        };

        applyBadge();

        const titleEl = document.querySelector('title');
        const observer = titleEl ? new MutationObserver(applyBadge) : null;
        observer?.observe(titleEl, { childList: true });

        return () => observer?.disconnect();
    }, [count]);

    useEffect(() => {
        setFaviconBadgeCount(count);
    }, [count]);
}
