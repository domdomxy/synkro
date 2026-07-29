import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Segmented Today / This Week / This Month / Custom control.
 * Shared by the user and admin dashboards (was previously duplicated in both
 * Pages/Dashboard.jsx and Pages/Admin/Dashboard.jsx). `routeName` lets each
 * page point it at its own Inertia route while keeping the same look.
 */
export default function RangeButtons({ range, routeName, customFrom, customTo }) {
    const [showCustom, setShowCustom] = useState(range === 'custom');
    const [from, setFrom] = useState(customFrom ?? '');
    const [to, setTo] = useState(customTo ?? '');

    const applyCustom = () => {
        if (from && to) router.get(route(routeName, { range: 'custom', from, to }), {}, { preserveScroll: true });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
                {Object.entries({ today: 'Today', week: 'This Week', month: 'This Month' }).map(([key, label]) => (
                    <Link
                        key={key}
                        href={route(routeName, { range: key })}
                        preserveScroll
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            range === key
                                ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                        onClick={() => setShowCustom(false)}
                    >
                        {label}
                    </Link>
                ))}
                <button
                    onClick={() => setShowCustom((v) => !v)}
                    className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        range === 'custom'
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Custom
                </button>
            </div>
            {showCustom && (
                <div className="flex items-center gap-1">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <button onClick={applyCustom} className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500">Go</button>
                </div>
            )}
        </div>
    );
}
