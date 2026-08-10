import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_COPY = {
    403: {
        title: "You don't have access to this",
        defaultMessage: "You don't have permission to view this page.",
    },
    404: {
        title: 'Page not found',
        defaultMessage: "That page doesn't exist - it may have been moved or deleted.",
    },
};

/**
 * Dedicated full-page error screen for 403/404 responses (see the
 * `$exceptions->render()` closure in bootstrap/app.php). Rendered directly
 * by the backend instead of a `redirect()->back()` - back() depends on the
 * session's previous URL, which for a directly-typed or bookmarked link
 * (no HTTP referer) can be some unrelated page the person happened to have
 * open earlier, making the "redirect" look random. This page always shows
 * up in place, regardless of navigation history.
 */
export default function Error({ status, message }) {
    const copy = STATUS_COPY[status] ?? STATUS_COPY[404];

    return (
        <AuthenticatedLayout>
            <Head title={copy.title} />
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{status}</p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{copy.title}</h1>
                <p className="mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    {message || copy.defaultMessage}
                </p>
                <div className="mt-8 flex items-center gap-3">
                    <Link
                        href={route('projects.index')}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                        Go to Projects
                    </Link>
                    <Link
                        href={route('dashboard')}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
