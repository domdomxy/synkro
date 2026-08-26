import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Segmented Today / This Week / This Month / Custom control.
 * Shared by the user and admin dashboards (was previously duplicated in both
 * Pages/Dashboard.jsx and Pages/Admin/Dashboard.jsx). `routeName` lets each
 * page point it at its own Inertia route while keeping the same look.
 *
 * `rangeParam`/`fromParam`/`toParam` default to the original "range"/"from"/
 * "to" query keys but can be overridden so a page can host more than one of
 * these controls at once against different bits of state (e.g. the
 * dashboard's Activity chart range vs. the Due Soon panel's own date-range
 * filter). `extraParams` is merged into every navigation so switching one
 * control doesn't wipe out the other's current query params - without it,
 * a plain `route(routeName, { range: key })` call drops everything not
 * explicitly passed in.
 */
export default function RangeButtons({ range, routeName, customFrom, customTo, rangeParam = 'range', fromParam = 'from', toParam = 'to', extraParams = {} }) {
    const [showCustom, setShowCustom] = useState(range === 'custom');
    const [from, setFrom] = useState(customFrom ?? '');
    const [to, setTo] = useState(customTo ?? '');

    const applyCustom = () => {
        if (from && to) router.get(route(routeName, { ...extraParams, [rangeParam]: 'custom', [fromParam]: from, [toParam]: to }), {}, { preserveScroll: true });
    };

    const ranges = {
        today: { short: 'Today', full: 'Today' },
        week: { short: 'Week', full: 'This Week' },
        month: { short: 'Month', full: 'This Month' },
    };

    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
                {Object.entries(ranges).map(([key, { short, full }]) => (
                    <Link
                        key={key}
                        href={route(routeName, { ...extraParams, [rangeParam]: key })}
                        preserveScroll
                        className={`min-h-[24px] rounded-md px-2 py-0.5 text-xs font-medium leading-[18px] transition-colors sm:min-h-0 ${
                            range === key
                                ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setShowCustom(false)}
                    >
                        <span className="sm:hidden">{short}</span>
                        <span className="hidden sm:inline">{full}</span>
                    </Link>
                ))}
                <button
                    onClick={() => setShowCustom((v) => !v)}
                    className={`flex min-h-[24px] items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium leading-[18px] transition-colors sm:min-h-0 ${
                        range === 'custom'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Custom
                </button>
            </div>
            {showCustom && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="min-h-[24px] rounded-md border-gray-300 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="min-h-[24px] rounded-md border-gray-300 px-2 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <button onClick={applyCustom} className="min-h-[24px] rounded-md bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-indigo-500">
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}
