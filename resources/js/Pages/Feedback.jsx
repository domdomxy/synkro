import { Head, Link, router } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import FeedbackPanel from '@/Components/FeedbackPanel';

/**
 * Guest-accessible (no auth required), so this keeps its own minimal header
 * instead of AuthenticatedLayout's nav - there may be no logged-in page
 * behind it at all. Only renders for a genuine standalone visit to /feedback
 * (typed URL, refresh, or bookmark) where there's no other page mounted to
 * show behind a modal.
 *
 * Reached from the Welcome page's "Help / Feedback" button, or from
 * Settings > Support, FeedbackPanel is instead opened directly as an
 * overlay on the page that was already showing (see useRouteOverlay), so
 * that page - Welcome, Settings, or whatever else - stays visible behind
 * the dialog instead of being replaced.
 */
export default function Feedback({ flash, categories, trackingId, from }) {
    const isFromSettings = from === 'settings';
    const backLabel = isFromSettings ? 'Back to Settings' : 'Back to Home';
    const backHref = isFromSettings ? route('settings.edit', { section: 'support' }) : '/';

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
            <div className="min-h-screen">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xl font-bold">Synkro</span>
                    </Link>
                    <Link href={backHref} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {backLabel}
                    </Link>
                </header>

                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    <FeedbackPanel flash={flash} categories={categories} trackingId={trackingId} from={from} onClose={closeStandalone} standalone />
                </main>
            </div>
        </>
    );
}
