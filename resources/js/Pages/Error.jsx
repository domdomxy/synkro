import ApplicationLogo from '@/Components/ApplicationLogo';
import ErrorMascot from '@/Components/ErrorBackground';
import { Head, Link, usePage } from '@inertiajs/react';

// One entry per status this screen is prepared to explain well. Anything
// else (see bootstrap/app.php's exceptions->render()) falls back to the
// 500 entry's tone/mood with whatever message the backend sent.
const STATUS_COPY = {
    403: {
        title: "You don't have access to this",
        defaultMessage: "You don't have permission to view this page.",
        tone: 'amber',
        mood: 'worried',
    },
    404: {
        title: 'Page not found',
        defaultMessage: "That page doesn't exist - it may have been moved or deleted.",
        tone: 'indigo',
        mood: 'confused',
    },
    419: {
        title: 'Your session expired',
        defaultMessage: 'For your security, this page timed out. Refresh and try again.',
        tone: 'indigo',
        mood: 'sleepy',
    },
    429: {
        title: 'Slow down a little',
        defaultMessage: "You've made too many requests in a short time. Give it a minute and try again.",
        tone: 'amber',
        mood: 'dizzy',
    },
    500: {
        title: 'Something went wrong',
        defaultMessage: "That's on us, not you. Our team's already been notified - try again in a moment.",
        tone: 'red',
        mood: 'shocked',
    },
    503: {
        title: 'Down for maintenance',
        defaultMessage: "Synkro is briefly offline for maintenance. We'll be back shortly.",
        tone: 'red',
        mood: 'sleeping',
    },
};

const TONE_STYLES = {
    indigo: {
        glow: 'bg-indigo-400/40 dark:bg-indigo-500/25',
        number: 'text-indigo-600 dark:text-indigo-400',
    },
    amber: {
        glow: 'bg-amber-400/40 dark:bg-amber-500/25',
        number: 'text-amber-600 dark:text-amber-400',
    },
    red: {
        glow: 'bg-red-400/40 dark:bg-red-500/25',
        number: 'text-red-500 dark:text-red-400',
    },
};

/**
 * Dedicated full-page error screen for any non-2xx HTTP response the app
 * hits (see the `$exceptions->render()` closure in bootstrap/app.php) - a
 * missing project, a route that never existed, an expired session, an
 * unhandled server error, all of it lands here instead of a blank page.
 *
 * Deliberately standalone (no AuthenticatedLayout/GuestLayout): this page
 * has to survive being rendered for a *signed-out* visitor who typos a URL
 * or follows a stale link, and AuthenticatedLayout assumes `auth.user` is
 * always present. Pulling in the full authenticated shell (nav, live
 * notification/websocket listeners, route overlays) here would also be a
 * lot of moving parts for a screen whose whole job is to stay up when
 * something else already broke.
 *
 * Big bold status number + a small reacting "task card" mascot
 * (ErrorMascot, in resources/js/Components/ErrorBackground.jsx) instead of
 * an ambient background wash - the earlier low-opacity version turned out
 * to all but disappear against the black theme's true-black background,
 * so this pass favors fully-opaque colors that hold up on every theme.
 */
export default function Error({ status, message }) {
    const { auth } = usePage().props;
    const isAuthed = Boolean(auth?.user);
    const copy = STATUS_COPY[status] ?? STATUS_COPY[500];
    const tone = TONE_STYLES[copy.tone];

    const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 dark:bg-gray-900">
            <Head title={copy.title} />

            <Link href="/" className="relative mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <ApplicationLogo className="h-7 w-7 fill-current text-indigo-600 sm:h-8 sm:w-8 dark:text-indigo-400" />
                <span className="text-base font-bold sm:text-lg">Synkro</span>
            </Link>

            <div className="relative w-full max-w-md text-center">
                <div className="relative mb-2 flex items-center justify-center">
                    <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute h-52 w-52 rounded-full blur-3xl ${tone.glow}`}
                    />
                    <ErrorMascot mood={copy.mood} className="relative -mr-6 h-32 w-32 shrink-0 sm:h-36 sm:w-36" />
                    <p className={`relative select-none text-[92px] font-black leading-none tracking-tight sm:text-[120px] ${tone.number}`}>
                        {status}
                    </p>
                </div>

                <h1 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-gray-100">
                    {copy.title}
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {message || copy.defaultMessage}
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href={isAuthed ? route('dashboard') : route('login')}
                        className="w-full rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 sm:w-auto"
                    >
                        {isAuthed ? 'Go to Dashboard' : 'Log in'}
                    </Link>
                    {isAuthed && (
                        <Link
                            href={route('projects.index')}
                            className="w-full rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                            Go to Projects
                        </Link>
                    )}
                    {canGoBack && (
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="w-full px-5 py-2.5 text-sm font-medium text-gray-500 transition hover:text-gray-700 sm:w-auto dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Go back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
