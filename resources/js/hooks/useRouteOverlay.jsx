import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
 * Delete Account, ...) still submits through the normal
 * useForm/router.post/patch/delete calls - none of that was touched, so
 * every existing processing/errors/recentlySuccessful behavior keeps
 * working exactly as it always has. But Inertia's router always swaps the
 * *entire* top-level page to whatever component the request lands on, with
 * no concept of "just this panel" - left alone, that means any save inside
 * an overlay replaces the real background page (Dashboard, a task board,
 * ...) with the standalone Settings/Account/Feedback page itself, which has
 * nothing behind it to show through the modal backdrop (hence it reading as
 * a flash to a blank page) and permanently loses the overlay for the rest
 * of the visit.
 *
 * To fix that without touching any of the panels' own form code, this
 * module watches Inertia's global router lifecycle: if a real visit starts
 * while an overlay is open, it remembers that this was an "overlay save"
 * and, once that visit lands somewhere still authenticated, it navigates
 * back to the real background page and then reopens the same panel on top
 * of it using the props that visit just returned - so the save still goes
 * through exactly as before, but the person ends up back where they
 * started instead of stranded on a standalone page. Logout/deactivate/
 * deletion (anything that ends up on a guest page) is left to behave as a
 * real navigation, since there is nothing left to restore behind it.
 *
 * Every piece of state this coordination needs is kept at MODULE scope
 * (plain variables below, not React refs/state) rather than inside the
 * hook. That's deliberate, not an oversight: AuthenticatedLayout - and
 * this hook along with it - fully unmounts and remounts on every one of
 * those top-level page swaps (Dashboard, Settings, Account and Feedback
 * each wrap themselves in their own separate AuthenticatedLayout). A
 * restore that spans "navigate back to the background page, then reopen
 * the panel" necessarily spans that remount, so anything the second half
 * needs has to survive it - a ref or a closure captured by the component
 * instance that was showing when the save started does not, since that
 * exact instance is what just got torn down. Module-level variables do
 * survive, because Inertia visits are client-side and never reload the
 * page - the module itself is evaluated once per tab.
 */

// The overlay key/props currently being shown, mirrored here so the
// router-level listeners can act on it without depending on any one
// hook instance still being mounted.
let isOpenFlag = false;
let currentKey = null;
// The real page (Dashboard, a task board, ...) that was showing before
// the first overlay in the current chain opened. Only set on a fresh
// open, never on a Settings<->Account<->Feedback switch, so however many
// panels someone hops between, this always points at the one real page
// underneath all of them.
let backgroundUrl = null;
// Set to the panel's key when a real visit starts while that panel's
// overlay is open (a form save inside it), so the 'success' handler below
// knows which panel to restore once it sees how that visit landed. null
// means "not an overlay save, leave it alone."
let pendingRestoreKey = null;
// Sends overlay updates to whichever hook instance is actually mounted
// right now. Updated on every mount/unmount below - this is what lets a
// callback survive the background page's remount: by the time it runs,
// this points at the new instance, not the one that scheduled it.
let liveSetOverlay = null;
// Identifies which mounted instance liveSetOverlay currently belongs to, so
// an unmounting instance only clears it if nothing newer has already taken
// over (the background-restore remount can mount the next instance before
// the previous one's cleanup runs).
let liveOwner = null;

function clearOverlay() {
    isOpenFlag = false;
    currentKey = null;
    liveSetOverlay?.(null);
}

router.on('before', () => {
    pendingRestoreKey = isOpenFlag ? currentKey : null;
    clearOverlay();
});

router.on('success', (event) => {
    const key = pendingRestoreKey;
    pendingRestoreKey = null;
    if (!key || !backgroundUrl) return;

    const props = event.detail?.page?.props;
    if (!props) return;

    // Logout, account deactivation/deletion, a session that expired
    // mid-save - anything that lands somewhere unauthenticated has
    // nothing left behind it worth restoring.
    if (!props.auth?.user) return;

    // Where the save itself just landed (settings/account/feedback's own
    // URL) - reused below so reopening the panel keeps the address bar
    // consistent with what's actually showing.
    const panelUrl = window.location.href;
    const restoreUrl = backgroundUrl;

    router.visit(restoreUrl, {
        preserveScroll: true,
        preserveState: false,
        replace: true,
        onFinish: () => {
            isOpenFlag = true;
            currentKey = key;
            window.history.replaceState({ overlay: key }, '', panelUrl);
            // Not the closure's own setOverlay - the CURRENTLY mounted
            // instance's, which by now is the one that just mounted for
            // restoreUrl. See the module-doc comment above.
            liveSetOverlay?.({ key, props });
        },
    });
});

if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        pendingRestoreKey = null;
        clearOverlay();
    });
}

export default function useRouteOverlay() {
    const [overlay, setOverlay] = useState(null); // { key, props } | null
    const setOverlayRef = useRef(setOverlay);
    setOverlayRef.current = setOverlay;

    useEffect(() => {
        const owner = setOverlayRef;
        liveSetOverlay = (next) => setOverlayRef.current(next);
        liveOwner = owner;
        return () => {
            if (liveOwner === owner) {
                liveSetOverlay = null;
                liveOwner = null;
            }
        };
    }, []);

    const open = async (key, url, version, { replace = false, extraProps = null } = {}) => {
        if (!isOpenFlag) {
            backgroundUrl = window.location.pathname + window.location.search;
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
            isOpenFlag = true;
            currentKey = key;
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
    };

    const close = () => {
        if (isOpenFlag) window.history.back();
    };

    return { overlay, open, close };
}
