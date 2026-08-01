import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

// Lets a panel (SettingsPanel, AccountPanel) reach the overlay opener from
// wherever it's rendered - as a direct child of AuthenticatedLayout (a
// standalone page visit) or as the manually-fetched overlay itself -
// without prop-drilling it through every page wrapper in between.
export const RouteOverlayActionsContext = createContext(null);
export function useRouteOverlayActions() {
    return useContext(RouteOverlayActionsContext);
}

/**
 * Opens an Inertia GET route as an in-place overlay instead of a full page
 * visit, so whatever page the user was actually on (Dashboard, Projects,
 * a task board, ...) stays mounted and visible behind it. A normal
 * Inertia::render() page (which is how Settings/Account/Feedback work by
 * default) replaces the entire page component tree on navigation, so
 * there's nothing left to show through a modal's translucent backdrop -
 * that's why those pages read as "blocking" while an in-page dialog like
 * the delete-confirmation modal doesn't: the confirmation never navigates
 * anywhere, it's just local state on the page that's already showing.
 *
 * This fetches the target route manually using Inertia's own request
 * protocol (the X-Inertia header), so it hits the exact same
 * controller/props a real visit would, then a panel component is rendered
 * on top of the still-mounted background page using those props.
 *
 * This intentionally only covers viewing/closing. If something inside the
 * panel triggers a real Inertia visit (a form save, a Link to somewhere
 * else), that visit is left to behave exactly as it does today - the
 * whole page swaps the normal way once it lands. Keeping form submissions
 * untouched means every existing useForm/router.patch call in Settings and
 * Account keeps working exactly as before; only the "open it to look/close
 * it again" path is new.
 */
export default function useRouteOverlay() {
    const [overlay, setOverlay] = useState(null); // { key, props } | null
    const isOpenRef = useRef(false);

    const open = useCallback(async (key, url, version, { replace = false, extraProps = null } = {}) => {
        try {
            const headers = {
                'X-Inertia': 'true',
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'text/html, application/xhtml+xml',
            };
            if (version) headers['X-Inertia-Version'] = version;

            const res = await fetch(url, { headers });

            if (res.status === 409) {
                // Server-side assets moved on since this tab loaded - same
                // case Inertia's own client handles with a hard reload.
                window.location = res.headers.get('X-Inertia-Location') || url;
                return;
            }

            if (!res.ok) throw new Error(`useRouteOverlay: ${url} responded ${res.status}`);

            const data = await res.json();
            isOpenRef.current = true;
            // Switching from one panel to another (Settings -> Account and
            // back) reuses the same back-stack entry instead of pushing a
            // new one each time, so however many times someone hops
            // between them, a single "back" still returns straight to the
            // real page that was behind the first one opened.
            window.history[replace ? 'replaceState' : 'pushState']({ overlay: key }, '', url);
            setOverlay({ key, props: extraProps ? { ...data.props, ...extraProps } : data.props });
        } catch (error) {
            // Fetch failed for some other reason - fall back to a real
            // visit so the trigger doesn't just look broken.
            router.visit(url);
        }
    }, []);

    const close = useCallback(() => {
        if (isOpenRef.current) window.history.back();
    }, []);

    useEffect(() => {
        const clear = () => {
            isOpenRef.current = false;
            setOverlay(null);
        };

        window.addEventListener('popstate', clear);
        // Any real Inertia visit starting - elsewhere on the page, or a
        // form submit inside the panel itself - means the page is about
        // to swap the normal way, so the overlay shouldn't linger on top
        // of whatever page comes next.
        const unlistenBefore = router.on('before', clear);

        return () => {
            window.removeEventListener('popstate', clear);
            unlistenBefore();
        };
    }, []);

    return { overlay, open, close };
}
