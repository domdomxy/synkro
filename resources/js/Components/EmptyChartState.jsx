/**
 * Replaces the activity area chart when there's nothing to plot yet. A chart
 * axis with three flat lines sitting at zero reads as broken rather than
 * "no activity yet", so once a range has no data at all we show this instead.
 */
export default function EmptyChartState({ height = 240, title = 'No activity in this period', subtitle }) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 text-center dark:border-gray-700"
            style={{ height }}
        >
            <svg className="mb-3 h-9 w-9 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            {subtitle && <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
    );
}
