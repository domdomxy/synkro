import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

// Lets a panel (SettingsPanel, AccountPanel, FeedbackPanel) reach the overlay
// opener from wherever it's rendered - as a direct child of
// AuthenticatedLayout (a standalone page visit) or as the manually-fetched
// overlay itself - without prop-drilling it through every page wrapper in
// between.
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
 * Something inside a panel (a Save button, Update Password, Send Feedback,
 * ...) still submits through the normal useForm/router.post/patch/delete
 * calls - none of that was touched, so every existing processing/errors/
 * recentlySuccessful behavior keeps working exactly as it always has.
 * But Inertia's router always swaps the *entire* top-level page to whatever
 * component the request lands on, with no concept of "just this panel" -
 * left alone, that means any save inside an overlay replaces the real
 * background page (Dashboard, a task board, ...) with the standalone
 * Settings/Account/Feedback page itself, which has nothing behind it to
 * show through the modal backdrop (hence it reading as a flash to a blank
 * page) and permanently loses the overlay for the rest of the visit.
 *
 * To fix that without touching any of the panels' own form code, this hook
 * watches Inertia's global router lifecycle: if a real visit starts while
 * an overlay is open, it remembers that this was an "overlay save" and, once
 * that visit lands somewhere still authenticated, it navigates back to the
 * real background page and then reopens the same panel on top of it using
 * the props that visit just returned - so the save still goes through
 * exactly as before, but the person ends up back where they started instead
 * of stranded on a standalone page. Logout/deactivate/deletion (anything
 * that ends up on a guest page) is left to behave as a real navigation,
 * since there is nothing left to restore behind it.
 */
export default function useRouteOverlay() {
    const [overlay, setOverlay] = useState(null); // { key, props } | null
    const isOpenRef = useRef(false);
    const activeKeyRef = useRef(null);
    // The real page (Dashboard, a task board, ...) that was showing before
    // the first overlay in the current chain opened. Only set on a fresh
    // open, never on a Settings<->Account<->Feedback switch, so however many
    // panels someone hops between, this always points at the one real page
    // underneath all of them.
    const backgroundRef = useRef(null);
    // Set to the panel's key when a real visit starts while that panel's
    // overlay is open (a form save inside it), so the 'success' handler
    // below knows which panel to restore once it sees how that visit
    // landed. null means "not an overlay save, leave it alone."
    const pendingRestoreKeyRef = useRef(null);

    const open = useCallback(async (key, url, version, { replace = false, extraProps = null } = {}) => {
        if (!isOpenRef.current) {
            backgroundRef.current = { url: window.location.pathname + window.location.search };
        }

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
            activeKeyRef.current = key;
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
            activeKeyRef.current = null;
            setOverlay(null);
        };

        const onPopstate = () => {
            pendingRestoreKeyRef.current = null;
            clear();
        };
        window.addEventListener('popstate', onPopstate);

        // Any real Inertia visit starting - elsewhere on the page, or a
        // form submit inside the panel itself - means the page is about
        // to swap the normal way, so the overlay shouldn't linger on top
        // of whatever page comes next. If this fired while a panel was
        // open, remember which panel it was (clear() below wipes
        // activeKeyRef) so 'success' can try to restore it once it knows
        // how that visit landed.
        const unlistenBefore = router.on('before', () => {
            pendingRestoreKeyRef.current = isOpenRef.current ? activeKeyRef.current : null;
            clear();
        });

        // Fires for every completed visit, including ones this hook makes
        // no attempt to touch - it's a no-op unless the 'before' handler
        // above just flagged one as an overlay save.
        const unlistenSuccess = router.on('success', (event) => {
            const key = pendingRestoreKeyRef.current;
            pendingRestoreKeyRef.current = null;
            if (!key) return;

            const background = backgroundRef.current;
            const page = event.detail?.page;
            const props = page?.props;

            // No background to restore, or nothing to reopen with - leave
            // the visit's own destination standing rather than guessing.
            if (!key || !background || !props) return;

            // Logout, account deactivation/deletion, a session that expired
            // mid-save - anything that lands somewhere unauthenticated has
            // nothing left behind it worth restoring.
            if (!props.auth?.user) return;

            // Where the save itself just landed (settings/account/feedback's
            // own URL) - reused below so reopening the panel keeps the
            // address bar consistent with what's actually showing.
            const panelUrl = window.location.href;

            router.visit(background.url, {
                preserveScroll: true,
                preserveState: false,
                replace: true,
                onFinish: () => {
                    isOpenRef.current = true;
                    activeKeyRef.current = key;
                    window.history.replaceState({ overlay: key }, '', panelUrl);
                    setOverlay({ key, props });
                },
            });
        });

        return () => {
            window.removeEventListener('popstate', onPopstate);
            unlistenBefore();
            unlistenSuccess();
        };
    }, []);

    return { overlay, open, close };
}
