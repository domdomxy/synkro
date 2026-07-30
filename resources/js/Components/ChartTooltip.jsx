/**
 * Custom recharts <Tooltip content={...}> renderer shared by both
 * dashboards' Activity charts. Replaces recharts' plain white box with a
 * glassy, blurred card that matches the confirm-dialog treatment elsewhere
 * in the app, with a colored dot per series and tabular-aligned values so
 * the numbers don't jitter around as the cursor moves across the chart.
 *
 * Entries are sorted by value (largest first) so the most relevant series
 * for whatever point the person is hovering always reads first, and
 * zero-only payloads are suppressed rather than showing an empty card.
 */
export default function ChartTooltip({ active, payload, label, colorMap }) {
    if (!active || !payload?.length) return null;

    const rows = [...payload]
        .filter((entry) => entry.value !== undefined && entry.value !== null)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    if (!rows.length) return null;

    return (
        <div className="min-w-[9.5rem] rounded-lg border border-gray-100 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-800/90">
            {label && <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>}
            <ul className="space-y-1">
                {rows.map((entry) => {
                    const key = entry.dataKey ?? entry.name;
                    const color = colorMap?.[key] ?? entry.color;
                    return (
                        <li key={key} className="flex items-center justify-between gap-4 text-xs">
                            <span className="flex min-w-0 items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                <span className="truncate">{entry.name}</span>
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                                {entry.value.toLocaleString()}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
