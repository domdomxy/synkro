import Dropdown from '@/Components/Dropdown';
import ChartTypeToggle from '@/Components/ChartTypeToggle';
import RangeButtons from '@/Components/RangeButtons';

const RANGE_LABELS = { today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom' };
const CHART_LABELS = { area: 'Area', bar: 'Bar', combo: 'Combo' };

/**
 * Single "Filters" button that opens a panel holding the Activity card's
 * chart-type toggle and date-range picker, instead of both segmented
 * controls sitting permanently expanded in the card header. They used to
 * live inline (still exported separately as ChartTypeToggle/RangeButtons
 * for anywhere that wants them always visible), but seven buttons at once
 * competed with the card title for space, especially once the header wraps
 * on narrower screens. The current selection is summarized on the trigger
 * itself (e.g. "This Week, Area") so the state is still visible at a glance
 * without opening the panel.
 *
 * `extraParams` is passed straight through to RangeButtons so this menu's
 * own date-range navigation preserves any other filter the page is tracking
 * (e.g. the Due Soon panel's separate date-range filter on the user
 * dashboard) instead of clobbering it.
 */
export default function ChartControlsMenu({ chartType, onChartTypeChange, range, routeName, customFrom, customTo, extraParams }) {
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
                        · {RANGE_LABELS[range] ?? range}, {CHART_LABELS[chartType] ?? chartType}
                    </span>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="auto" contentClasses="w-max max-w-[calc(100vw-2rem)] space-y-2 bg-white p-2.5 dark:bg-gray-800 sm:space-y-3 sm:p-3">
                <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:mb-1.5">Chart type</p>
                    <ChartTypeToggle value={chartType} onChange={onChartTypeChange} />
                </div>
                <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 sm:mb-1.5">Date range</p>
                    <RangeButtons range={range} routeName={routeName} customFrom={customFrom} customTo={customTo} extraParams={extraParams} />
                </div>
            </Dropdown.Content>
        </Dropdown>
    );
}
