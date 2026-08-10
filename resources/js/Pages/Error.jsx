import ApplicationLogo from '@/Components/ApplicationLogo';
import ErrorBackground from '@/Components/ErrorBackground';
import { CompassIcon, LockIcon, ClockIcon, AlertTriangleIcon, CloudOffIcon, GaugeIcon } from '@/Components/Auth/icons';
import { Head, Link, usePage } from '@inertiajs/react';

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

// One entry per status this screen is prepared to explain well. Anything
// else (see bootstrap/app.php's exceptions->render()) falls back to the
// 500 entry's tone with whatever message the backend sent.
const STATUS_COPY = {
    403: {
        title: "You don't have access to this",
        defaultMessage: "You don't have permission to view this page.",
        icon: LockIcon,
        tone: 'amber',
    },
    404: {
        title: 'Page not found',
        defaultMessage: "That page doesn't exist - it may have been moved or deleted.",
        icon: CompassIcon,
        tone: 'indigo',
    },
    419: {
        title: 'Your session expired',
        defaultMessage: 'For your security, this page timed out. Refresh and try again.',
        icon: ClockIcon,
        tone: 'indigo',
    },
    429: {
        title: 'Slow down a little',
        defaultMessage: "You've made too many requests in a short time. Give it a minute and try again.",
        icon: GaugeIcon,
        tone: 'amber',
    },
    500: {
        title: 'Something went wrong',
        defaultMessage: "That's on us, not you. Our team's already been notified - try again in a moment.",
        icon: AlertTriangleIcon,
        tone: 'red',
    },
    503: {
        title: 'Down for maintenance',
        defaultMessage: "Synkro is briefly offline for maintenance. We'll be back shortly.",
        icon: CloudOffIcon,
        tone: 'red',
    },
};

const TONE_STYLES = {
    indigo: {
        glow: 'bg-indigo-400/25 dark:bg-indigo-500/10',
        badge: 'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:ring-indigo-900/60',
        code: 'text-indigo-600 dark:text-indigo-400',
        sketch: 'text-indigo-500/25 dark:text-indigo-400/25',
    },
    amber: {
        glow: 'bg-amber-400/25 dark:bg-amber-500/10',
        badge: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60',
        code: 'text-amber-600 dark:text-amber-400',
        sketch: 'text-amber-500/25 dark:text-amber-400/25',
    },
    red: {
        glow: 'bg-red-400/25 dark:bg-red-500/10',
        badge: 'bg-red-100 text-red-500 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/60',
        code: 'text-red-500 dark:text-red-400',
        sketch: 'text-red-500/25 dark:text-red-400/25',
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
 * The background sketch (ErrorBackground) draws Synkro's own board/card/
 * dependency-line language faintly behind the content, with one connector
 * snapped right above the badge - the visual idea being that this page is
 * where a link in the board broke.
 */
export default function Error({ status, message }) {
    const { auth } = usePage().props;
    const isAuthed = Boolean(auth?.user);
    const copy = STATUS_COPY[status] ?? STATUS_COPY[500];
    const tone = TONE_STYLES[copy.tone];
    const Icon = copy.icon;

    const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 dark:bg-gray-900">
            <Head title={copy.title} />

            <ErrorBackground
                dotClass="text-gray-400/40 dark:text-gray-100/[0.06]"
                lineClass="text-gray-400/60 dark:text-gray-100/[0.09]"
                toneClass={tone.sketch}
            />

            <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-1/2 top-[38%] -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${tone.glow}`}
            />

            <Link href="/" className="relative mb-10 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <ApplicationLogo className="h-7 w-7 fill-current text-indigo-600 sm:h-8 sm:w-8 dark:text-indigo-400" />
                <span className="text-base font-bold sm:text-lg">Synkro</span>
            </Link>

            <div className="relative w-full max-w-md text-center">
                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${tone.badge}`}>
                    <Icon className="h-8 w-8" />
                </div>

                <p style={MONO} className={`text-sm font-semibold tracking-[0.14em] ${tone.code}`}>
                    ERROR {status}
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-gray-100">
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
                            className="w-full rounded-md border border-gray-300 bg-white/60 px-5 py-2.5 text-sm font-medium text-gray-700 backdrop-blur-sm transition hover:bg-white sm:w-auto dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-200 dark:hover:bg-gray-800"
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
