import { useState } from 'react';
import { router } from '@inertiajs/react';
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
 * Pagination for Laravel's paginate()->withQueryString() response shape.
 * Pass the whole paginator object (e.g. `users`, `projects`, `logs`) as `meta` -
 * it needs `from`, `to`, `total`, `current_page`, `last_page`.
 *
 * Page numbers/URLs are built client-side (see utils/paginationRange) rather
 * than read off `meta.links`, because Laravel's own links array is already
 * collapsed using its own onEachSide window - which merges the boundary and
 * current-page windows together once they're close (page 6 of 15 comes back
 * as "1 2 3 4 5 6 7 8 9 10 ... 14 15" instead of a fixed 6-number window),
 * and doesn't include a url for every page number anyway.
 *
 * Layout: stacks (summary text over full-width nav) below `sm`, and sits
 * inline side-by-side above it. Numbered page pills only render at `sm`+;
 * phones get a compact "Page X of Y" readout plus large tap targets instead,
 * and the go-to-page jump box (redundant with that readout, fiddly to type
 * into on a phone) is reserved for `sm`+ too.
 */
export default function Pagination({ meta }) {
    if (!meta || !meta.total) return null;
    const { from, to, total, current_page, last_page } = meta;

    const buildUrl = (page) => {
        const url = new URL(window.location.href);
        if (page <= 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        return `${url.pathname}${url.search}`;
    };

    const go = (page) => {
        if (page < 1 || page > last_page || page === current_page) return;
        router.get(buildUrl(page), {}, { preserveState: true, preserveScroll: true });
    };

    const pageLinks = buildPageList(current_page, last_page, { siblingCount: 1, trailingCount: 3 });
    const showJumpButtons = pageLinks.includes('...');

    const [goToValue, setGoToValue] = useState('');

    const submitGoTo = () => {
        const parsed = parseInt(goToValue, 10);
        if (!parsed || parsed < 1 || parsed > last_page) return;
        go(parsed);
        setGoToValue('');
    };

    const navButtonClass =
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-30 sm:h-8 sm:w-8 dark:text-gray-400 dark:hover:bg-gray-700 dark:active:bg-gray-600';

    return (
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <p className="text-center text-sm text-gray-500 sm:text-left dark:text-gray-400">
                Showing{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{from ?? 0}</span>
                {'-'}
                <span className="font-medium text-gray-700 dark:text-gray-300">{to ?? 0}</span>
                {' of '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
            </p>

            {last_page > 1 && (
                <nav
                    className="flex items-center justify-center gap-1 sm:justify-start sm:border-l sm:border-gray-100 sm:pl-4 dark:sm:border-gray-700"
                    aria-label="Pagination"
                >
                    {showJumpButtons && (
                        <button
                            type="button"
                            disabled={current_page === 1}
                            onClick={() => go(1)}
                            className={navButtonClass}
                            aria-label="First page"
                        >
                            <ChevronDoubleLeftIcon />
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={current_page === 1}
                        onClick={() => go(current_page - 1)}
                        className={navButtonClass}
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
                                    aria-current={link === current_page ? 'page' : undefined}
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                        link === current_page
                                            ? 'bg-indigo-600 font-medium text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {link}
                                </button>
                            )
                        )}
                    </div>

                    <span className="min-w-[5.5rem] text-center text-sm font-medium text-gray-600 sm:hidden dark:text-gray-300">
                        Page {current_page} of {last_page}
                    </span>

                    <button
                        type="button"
                        disabled={current_page === last_page}
                        onClick={() => go(current_page + 1)}
                        className={navButtonClass}
                        aria-label="Next page"
                    >
                        <ChevronRightIcon />
                    </button>

                    {showJumpButtons && (
                        <button
                            type="button"
                            disabled={current_page === last_page}
                            onClick={() => go(last_page)}
                            className={navButtonClass}
                            aria-label="Last page"
                        >
                            <ChevronDoubleRightIcon />
                        </button>
                    )}

                    {showJumpButtons && (
                        <div className="ml-1 hidden items-center gap-1 border-l border-gray-200 pl-2 sm:flex dark:border-gray-700">
                            <span className="hidden text-sm text-gray-400 lg:inline dark:text-gray-500">Page</span>
                            <input
                                type="number"
                                min="1"
                                max={last_page}
                                value={goToValue}
                                onChange={(e) => setGoToValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitGoTo()}
                                placeholder="#"
                                title={`Go to page (1-${last_page})`}
                                className="w-14 rounded-md border-gray-300 px-2 py-1 text-xs leading-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                                type="button"
                                onClick={submitGoTo}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
