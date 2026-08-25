import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

// Mirrors the sm breakpoint used elsewhere for styling (see the static
// isMobileViewport() in useLandscapeOnOpen), but reactive: it re-renders on
// resize/rotation instead of being read once. Components that need to pick
// a different *behavior* on mobile - not just different classes - want this
// one, since a stale check from initial mount wouldn't be enough there.
export default function useIsMobileViewport() {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mql = window.matchMedia(QUERY);
        const onChange = (e) => setIsMobile(e.matches);

        mql.addEventListener?.('change', onChange);
        return () => mql.removeEventListener?.('change', onChange);
    }, []);

    return isMobile;
}
