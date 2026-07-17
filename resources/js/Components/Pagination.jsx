import { router } from '@inertiajs/react';

function ChevronLeftIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

/**
 * Pagination for Laravel's paginate()->withQueryString() response shape.
 * Pass the whole paginator object (e.g. `users`, `projects`, `logs`) as `meta` —
 * it needs `links`, `from`, `to`, `total`, `current_page`, `last_page`.
 */
export default function Pagination({ meta }) {
    if (!meta || !meta.links || meta.links.length < 2) return null;
    const { links, from, to, total, current_page, last_page } = meta;

    if (!total) return null;

    const go = (url) => url && router.get(url, {}, { preserveState: true, preserveScroll: true });

    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    return (
        <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{from ?? 0}</span>
                {'-'}
                <span className="font-medium text-gray-700 dark:text-gray-300">{to ?? 0}</span>
                {' of '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
            </p>

            {last_page > 1 && (
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                        type="button"
                        disabled={!prevLink.url}
                        onClick={() => go(prevLink.url)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                        aria-label="Previous page"
                    >
                        <ChevronLeftIcon />
                    </button>

                    <div className="hidden items-center gap-1 sm:flex">
                        {pageLinks.map((link, i) =>
                            link.label === '...' ? (
                                <span key={i} className="px-1.5 text-sm text-gray-400 dark:text-gray-500">
                                    &hellip;
                                </span>
                            ) : (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => go(link.url)}
                                    aria-current={link.active ? 'page' : undefined}
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition ${
                                        link.active
                                            ? 'bg-indigo-600 font-medium text-white'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {link.label}
                                </button>
                            )
                        )}
                    </div>

                    <span className="px-2 text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                        Page {current_page} of {last_page}
                    </span>

                    <button
                        type="button"
                        disabled={!nextLink.url}
                        onClick={() => go(nextLink.url)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                        aria-label="Next page"
                    >
                        <ChevronRightIcon />
                    </button>
                </nav>
            )}
        </div>
    );
}
