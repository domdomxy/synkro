/**
 * Shared "metric tile" used across the dashboard-style admin pages.
 *
 * - `sub` is a plain description line (e.g. "Assigned to you, not yet done"),
 *   optionally including a composition ratio like "18% of all users" as text.
 * - `pct` is an optional signed number representing a REAL period-over-period
 *   change (e.g. 12, -4.5) — pass it only when it's backed by real historical
 *   data (created_at timestamps etc). It renders as a colored +/-% badge at
 *   the end of the sub line: green for positive, red for negative, gray for 0.
 *   Composition/ratio percentages (a share of a total, not a change over
 *   time) should go in `sub` as plain text instead of `pct`, since they have
 *   no real "up is good, down is bad" direction to color.
 */
export default function StatCard({ label, value, sub, pct, accentColor, icon }) {
    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`mt-1 text-3xl font-semibold ${accentColor ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
                    {(sub || pct !== undefined) && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {sub}
                            {pct !== undefined && pct !== null && (
                                <span className={`ml-1.5 font-medium ${pct > 0 ? 'text-green-600 dark:text-green-400' : pct < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {pct > 0 ? '+' : ''}{pct}%
                                </span>
                            )}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 ${accentColor ?? 'text-gray-400 dark:text-gray-400'}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
