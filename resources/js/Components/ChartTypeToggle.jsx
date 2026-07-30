/**
 * Segmented control to switch how the Activity chart renders the same
 * dataset: filled area+line, grouped bars, or bars with a line overlay.
 * Visual language matches RangeButtons so the two sit comfortably together
 * on the Activity card.
 */
const OPTIONS = [
    {
        key: 'area',
        label: 'Area',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 3 5-7 4 4" />
                <path d="M3 20h18" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        key: 'bar',
        label: 'Bar',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7" />
            </svg>
        ),
    },
    {
        key: 'combo',
        label: 'Combo',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20v-6m6 6V9m6 11v-4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l5 4 4-6 5 3" />
            </svg>
        ),
    },
];

export default function ChartTypeToggle({ value, onChange }) {
    return (
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
            {OPTIONS.map(({ key, label, icon }) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    title={`${label} chart`}
                    aria-pressed={value === key}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        value === key
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}
