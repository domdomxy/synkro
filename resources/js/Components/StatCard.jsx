/**
 * Shared "metric tile" used across the dashboard-style admin pages.
 *
 * - `sub` is a plain description line (e.g. "Assigned to you, not yet done"),
 *   optionally including a composition ratio like "18% of all users" as text.
 * - `pct` is an optional signed number representing a REAL period-over-period
 *   change (e.g. 12, -4.5) - pass it only when it's backed by real historical
 *   data (created_at timestamps etc). It renders on its own line below `sub`
 *   as "▲ +12% vs last month" (green/red/gray for up/down/flat), kept visually
 *   separate from `sub` so a composition ratio like "8% of all users" is never
 *   mistaken for the same number as the trend sitting right next to it. Below
 *   the `sm` breakpoint the 2-column card grid is too narrow for the full
 *   sentence, so it collapses to just "▲ +12%" (full text back from `sm` up;
 *   a title tooltip keeps "vs last month" reachable on mobile via long-press
 *   or hover) rather than wrapping onto a second line that crowds the card.
 *   Composition/ratio percentages (a share of a total, not a change over
 *   time) should go in `sub` as plain text instead of `pct`, since they have
 *   no real "up is good, down is bad" direction to color.
 * - `accentColor` is a Tailwind text-color class pair (e.g.
 *   "text-indigo-600 dark:text-indigo-400"). When present, the icon badge
 *   picks up a matching tinted background instead of the plain gray one, so
 *   the icon reads as "this card's color" at a glance rather than always
 *   sitting in a neutral circle.
 */

// Maps the color name inside an accentColor string (e.g. "indigo" from
// "text-indigo-600 ...") to a tinted badge background. Kept as a static
// lookup of full class strings, not a template literal, so Tailwind's JIT
// scanner picks these up at build time.
const BADGE_TINTS = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950/40',
    green: 'bg-green-50 dark:bg-green-950/40',
    purple: 'bg-purple-50 dark:bg-purple-950/40',
    red: 'bg-red-50 dark:bg-red-950/40',
    orange: 'bg-orange-50 dark:bg-orange-950/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40',
    blue: 'bg-blue-50 dark:bg-blue-950/40',
    pink: 'bg-pink-50 dark:bg-pink-950/40',
};

function badgeTintFor(accentColor) {
    const match = accentColor?.match(/text-([a-z]+)-\d+/);
    return (match && BADGE_TINTS[match[1]]) || 'bg-gray-50 dark:bg-gray-700';
}

export default function StatCard({ label, value, sub, pct, accentColor, icon }) {
    return (
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 sm:p-6">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{label}</p>
                    <p className={`mt-1 text-2xl font-semibold sm:text-3xl ${accentColor ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
                    {sub && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
                    )}
                    {pct !== undefined && pct !== null && (
                        <p
                            className={`mt-0.5 whitespace-nowrap text-xs font-medium ${pct > 0 ? 'text-green-600 dark:text-green-400' : pct < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                            title="Compared to last month"
                        >
                            {pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : '– '}{pct}%<span className="hidden sm:inline"> vs last month</span>
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 ${badgeTintFor(accentColor)} ${accentColor ?? 'text-gray-400 dark:text-gray-400'}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
