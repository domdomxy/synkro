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

// Mirrors Laravel's default paginator window: shows every page while there
// aren't too many, then falls back to first/last page(s) plus a few pages
// around the current one, collapsing the gaps into '...' - e.g.
// [1, 2, 3, '...', 17] or [1, '...', 7, 8, 9, 10, 11, '...', 17].
function buildPageList(current, total) {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const boundaryCount = 1;
    const siblingCount = 2;
    const pages = new Set();

    for (let i = 1; i <= boundaryCount; i++) pages.add(i);
    for (let i = total - boundaryCount + 1; i <= total; i++) pages.add(i);
    for (let i = current - siblingCount; i <= current + siblingCount; i++) {
        if (i >= 1 && i <= total) pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const withDots = [];
    let prev = null;
    for (const page of sorted) {
        if (prev !== null) {
            if (page - prev === 2) {
                withDots.push(prev + 1);
            } else if (page - prev > 1) {
                withDots.push('...');
            }
        }
        withDots.push(page);
        prev = page;
    }
    return withDots;
}

/**
 * Same look, feel, and feature set as `Pagination.jsx` (page numbers, ellipses,
 * "Showing X-Y of Z", prev/next controls) but for data that's already been
 * fetched in full and is being paginated on the client (e.g. `filtered.slice(...)`)
 * instead of a Laravel paginator response. Pass `page`/`totalPages`/`total`/`perPage`
 * plus `onPageChange` and this drives a local page number instead of navigating.
 */
export default function LocalPagination({ page, totalPages, total, perPage, onPageChange }) {
    if (!total) return null;

    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);
    const pageLinks = buildPageList(page, totalPages);

    const go = (p) => {
        if (p < 1 || p > totalPages || p === page) return;
        onPageChange(p);
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{from}</span>
                {'-'}
                <span className="font-medium text-gray-700 dark:text-gray-300">{to}</span>
                {' of '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
            </p>

            {totalPages > 1 && (
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => go(page - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                        aria-label="Previous page"
                    >
                        <ChevronLeftIcon />
                    </button>

                    <div className="hidden items-center gap-1 sm:flex">
                        {pageLinks.map((link, i) =>
                            link === '...' ? (
                                <span key={i} className="px-1.5 text-sm text-gray-400 dark:text-gray-500">
                                    &hellip;
                                </span>
                            ) : (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => go(link)}
                                    aria-current={link === page ? 'page' : undefined}
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition ${
                                        link === page
                                            ? 'bg-indigo-600 font-medium text-white'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {link}
                                </button>
                            )
                        )}
                    </div>

                    <span className="px-2 text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => go(page + 1)}
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
