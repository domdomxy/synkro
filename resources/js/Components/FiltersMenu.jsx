import { useContext } from 'react';
import Dropdown, { DropDownContext } from '@/Components/Dropdown';

function FunnelIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 6h18M9 18h6" />
        </svg>
    );
}

// Rendered as a child of Dropdown.Content so it sits inside DropDownContext's
// provider tree and can close the panel itself after Apply/Clear, the same
// way AccountMenu closes itself on navigation instead of relying on a
// blanket "close on any click inside" handler.
function PanelBody({ onApply, onClear, hasActiveFilters, children }) {
    const { setOpen } = useContext(DropDownContext);
    const showFooter = Boolean(onApply) || (hasActiveFilters && onClear);

    return (
        <div className="w-max min-w-64 max-w-[calc(100vw-2rem)] space-y-3">
            {children}
            {showFooter && (
                <div className="flex items-center justify-between gap-2 pt-1">
                    {onApply ? (
                        <button
                            type="button"
                            onClick={() => { onApply(); setOpen(false); }}
                            className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                            Apply Filters
                        </button>
                    ) : (
                        <span />
                    )}
                    {hasActiveFilters && onClear && (
                        <button
                            type="button"
                            onClick={() => { onClear(); setOpen(false); }}
                            className="text-xs text-gray-500 hover:underline dark:text-gray-400"
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Collapses a page's non-search list filters (status/role/category selects,
 * date ranges, etc.) into a single "Filters" button instead of them sitting
 * inline in a row next to the search bar. Search itself stays outside the
 * menu, unchanged, since it's the control people reach for first and typing
 * in it doesn't need a click to open anything. A small badge on the trigger
 * counts how many filters are off their default, so the filtered state is
 * still visible at a glance without opening the panel.
 *
 * Two usage modes:
 * - Pass `onApply` for pages that stage filter changes locally and only
 *   send them on an explicit action (adds an "Apply Filters" button that
 *   also closes the panel).
 * - Omit `onApply` for pages that already apply each change immediately
 *   (the panel just stays open for further tweaks and closes on outside
 *   click, the same treatment as ChartControlsMenu on the dashboards).
 *
 * Filter rows go inside as children, typically wrapped in `<FiltersMenu.Row
 * label="...">`. Controls that render their own label (e.g. DateRangeFilter)
 * can be passed directly without a Row wrapper.
 */
export default function FiltersMenu({
    activeCount = 0,
    hasActiveFilters = activeCount > 0,
    onApply,
    onClear,
    align = 'left',
    buttonClassName = '',
    children,
}) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className={`flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 ${buttonClassName}`}
                >
                    <FunnelIcon />
                    Filters
                    {activeCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align={align} width="auto" contentClasses="w-max max-w-[calc(100vw-2rem)] bg-white p-3 dark:bg-gray-800">
                <PanelBody onApply={onApply} onClear={onClear} hasActiveFilters={hasActiveFilters}>
                    {children}
                </PanelBody>
            </Dropdown.Content>
        </Dropdown>
    );
}

function FilterRow({ label, children }) {
    return (
        <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
            {children}
        </div>
    );
}

FiltersMenu.Row = FilterRow;
