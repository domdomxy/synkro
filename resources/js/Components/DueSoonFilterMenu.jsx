import Dropdown from '@/Components/Dropdown';
import RangeButtons from '@/Components/RangeButtons';

const RANGE_LABELS = { today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom' };

/**
 * "Filters" button for the Due Soon panel, styled after ChartControlsMenu's
 * trigger on the Activity card above it, but holding just a date-range
 * picker since there's no chart type to go with it. Uses its own due_range/
 * due_from/due_to query params (via RangeButtons' rangeParam/fromParam/
 * toParam) so it doesn't collide with the Activity card's range/from/to,
 * and passes those along as extraParams so switching one filter doesn't
 * reset the other.
 */
export default function DueSoonFilterMenu({ range, routeName, customFrom, customTo, extraParams }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 6h18M9 18h6" />
                    </svg>
                    Filters
                    <span className="hidden text-gray-400 dark:text-gray-500 sm:inline">
                        · {RANGE_LABELS[range] ?? range}
                    </span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="auto" contentClasses="w-max max-w-[calc(100vw-2rem)] space-y-3 bg-white p-3 dark:bg-gray-800">
                <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Due date range</p>
                    <RangeButtons
                        range={range}
                        routeName={routeName}
                        customFrom={customFrom}
                        customTo={customTo}
                        rangeParam="due_range"
                        fromParam="due_from"
                        toParam="due_to"
                        extraParams={extraParams}
                    />
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
