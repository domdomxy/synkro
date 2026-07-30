/**
 * A recharts <Legend content={...}> renderer whose entries act as a filter
 * that supports comparing two or more series side by side:
 *   - No selection (default): every series is shown.
 *   - Click one entry: show only that series.
 *   - Click another: it's added, so now those two (or three, or more) are
 *     shown together for comparison.
 *   - Click a selected entry again to remove it from the comparison; once
 *     nothing is selected, every series is shown again.
 *
 * Usage:
 *   const [selectedKeys, setSelectedKeys] = useState([]); // [] = show all
 *   const toggleKey = (key) => setSelectedKeys((prev) =>
 *       prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
 *   );
 *   ...
 *   <Legend content={(props) => <ClickableLegend {...props} selectedKeys={selectedKeys} onToggle={toggleKey} />} />
 *   <Area dataKey="completed" hide={selectedKeys.length > 0 && !selectedKeys.includes('completed')} ... />
 */
export default function ClickableLegend({ payload, selectedKeys = [], onToggle, colorMap }) {
    if (!payload?.length) return null;

    return (
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs">
            {payload.map((entry) => {
                const key = entry.dataKey ?? entry.value;
                const color = colorMap?.[key] ?? entry.color;
                const isSelected = selectedKeys.includes(key);
                const isDimmed = selectedKeys.length > 0 && !isSelected;
                const title = isSelected
                    ? 'Click to remove from comparison'
                    : selectedKeys.length > 0
                      ? 'Click to add to comparison'
                      : 'Click to isolate, click more to compare';

                return (
                    <li
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => onToggle(key)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onToggle(key);
                            }
                        }}
                        title={title}
                        className={`flex cursor-pointer select-none items-center gap-1.5 rounded px-1.5 py-0.5 transition-all hover:opacity-80 ${
                            isDimmed ? 'opacity-40' : 'opacity-100'
                        } ${isSelected ? 'ring-1 ring-inset ring-current/30' : ''}`}
                    >
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-gray-600 dark:text-gray-300">{entry.value}</span>
                    </li>
                );
            })}
        </ul>
    );
}
