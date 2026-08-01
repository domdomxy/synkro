import { useState } from 'react';
import { buildPageList } from '@/utils/paginationRange';

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

function ChevronDoubleLeftIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 19l-7-7 7-7M11 19l-7-7 7-7" />
        </svg>
    );
}

function ChevronDoubleRightIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 5l7 7-7 7M13 5l7 7-7 7" />
        </svg>
    );
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
    const pageLinks = buildPageList(page, totalPages, { siblingCount: 1, trailingCount: 3 });
    const showJumpButtons = pageLinks.includes('...');

    const go = (p) => {
        if (p < 1 || p > totalPages || p === page) return;
        onPageChange(p);
    };

    const [goToValue, setGoToValue] = useState('');

    const submitGoTo = () => {
        const parsed = parseInt(goToValue, 10);
        if (!parsed || parsed < 1 || parsed > totalPages) return;
        go(parsed);
        setGoToValue('');
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
                    {showJumpButtons && (
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => go(1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                            aria-label="First page"
                        >
                            <ChevronDoubleLeftIcon />
                        </button>
                    )}

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

                    {showJumpButtons && (
                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() => go(totalPages)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                            aria-label="Last page"
                        >
                            <ChevronDoubleRightIcon />
                        </button>
                    )}

                    {showJumpButtons && (
                        <div className="ml-1 flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                            <span className="hidden text-sm text-gray-400 dark:text-gray-500 sm:inline">Page</span>
                            <input
                                type="number"
                                min="1"
                                max={totalPages}
                                value={goToValue}
                                onChange={(e) => setGoToValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitGoTo()}
                                placeholder="#"
                                title={`Go to page (1-${totalPages})`}
                                className="w-14 rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <button
                                type="button"
                                onClick={submitGoTo}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Go
                            </button>
                        </div>
                    )}
                </nav>
            )}
        </div>
    );
}
