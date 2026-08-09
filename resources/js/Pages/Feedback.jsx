import { Head, router } from '@inertiajs/react';
import FeedbackPanel from '@/Components/FeedbackPanel';

/**
 * Guest-accessible (no auth required). Only renders for a genuine standalone
 * visit to /feedback (typed URL, refresh, or bookmark) where there's no
 * other page mounted to show behind a modal. No page-level header here -
 * FeedbackPanel's own sidebar already has the Synkro logo and "Back to
 * Home"/"Back to Settings" link, so a second one above it was redundant.
 *
 * Reached from the Welcome page's "Help / Feedback" button, or from
 * Settings > Support, FeedbackPanel is instead opened directly as an
 * overlay on the page that was already showing (see useRouteOverlay), so
 * that page - Welcome, Settings, or whatever else - stays visible behind
 * the dialog instead of being replaced.
 */
export default function Feedback({ flash, categories, trackingId, from }) {
    // Same "go back to wherever this was opened from, falling back to home"
    // behavior as the in-app Settings dialog's close button.
    const closeStandalone = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/');
        }
    };

    return (
        <>
            <Head title="Help & Feedback" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <main className="mx-auto max-w-8xl px-4 py-10 sm:px-6">
                    <FeedbackPanel flash={flash} categories={categories} trackingId={trackingId} from={from} onClose={closeStandalone} standalone />
                </main>
            </div>
        </>
    );
}
