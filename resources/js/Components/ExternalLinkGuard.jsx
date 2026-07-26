import useConfirm from '@/hooks/useConfirm';

/**
 * Wraps the whole app (mounted once in app.jsx, outside Inertia's page switching)
 * and intercepts every click on a link that would take the user off Synkro,
 * showing a "leave this site?" confirmation before actually navigating.
 *
 * Deliberately implemented as a single capture-phase click handler on a
 * wrapper div around the whole app, rather than touching every place a link
 * can appear. Links reach the page two ways that a per-component fix can't
 * both cover:
 *   - Components/Linkify.jsx renders real React <a> elements
 *   - app/Support/Linkifier.php linkifies rich text server-side into raw HTML
 *     that several pages inject via dangerouslySetInnerHTML (task/project
 *     descriptions, feedback bodies, activity log details, etc.)
 * A single global listener catches both without per-render-site changes, and
 * automatically covers any future page that renders a link either way.
 *
 * "External" = absolute http(s) URL whose hostname differs from this site's.
 * Relative links, in-page anchors, mailto:/tel:, and same-origin links are
 * left alone and navigate immediately as normal.
 *
 * Modifier-clicks (ctrl/cmd/shift/middle-click) are intentionally left alone —
 * that's a deliberate "open in background tab" gesture, not a plain click, so
 * we don't interrupt it with a confirmation dialog.
 */
export default function ExternalLinkGuard({ children }) {
    const { confirm, ConfirmDialog } = useConfirm();

    const handleClick = async (event) => {
        // Only plain left-clicks; let modifier-clicks and middle-clicks through untouched.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const anchor = event.target.closest?.('a[href]');
        if (!anchor) return;

        let url;
        try {
            url = new URL(anchor.href, window.location.href);
        } catch {
            return; // unparseable href — nothing we can safely check, leave it alone
        }

        if (url.protocol !== 'http:' && url.protocol !== 'https:') return; // mailto:, tel:, etc.
        if (url.hostname === window.location.hostname) return; // same-site, no prompt needed

        event.preventDefault();
        event.stopPropagation();

        const proceed = await confirm(
            `You're about to leave Synkro to visit ${url.hostname}. Make sure you trust this link before continuing.`,
            { title: 'Leave Synkro?', confirmLabel: 'Continue', cancelLabel: 'Go back' },
        );

        if (proceed) {
            const target = anchor.target || '_blank';
            window.open(url.href, target, 'noopener,noreferrer');
        }
    };

    return (
        // capture phase so this runs before any per-component onClick/stopPropagation;
        // display:contents keeps this div out of the box layout entirely, so it can't
        // break any page's min-h-screen/flex chain that expects to be a direct child
        // of #app
        <div onClickCapture={handleClick} style={{ display: 'contents' }}>
            {children}
            {ConfirmDialog}
        </div>
    );
}
