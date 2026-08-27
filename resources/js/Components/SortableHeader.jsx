function SortIcon({ active, direction }) {
    if (!active) {
        // Both arrows, muted - column is sortable but not the current sort.
        return (
            <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
        );
    }
    return (
        <svg className="h-3.5 w-3.5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {direction === 'desc' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            )}
        </svg>
    );
}

/**
 * Clickable, sortable <th> for admin tables. Clicking toggles asc/desc on
 * that column; clicking a different column switches to it at asc.
 *
 * Usage: <SortableHeader label="Name" column="name" sort={sort} direction={direction} onSort={handleSort} />
 * Pass no `column` (or omit onSort) for a plain, non-sortable header.
 *
 * `padding` fully replaces the default cell padding (rather than being
 * merged with it) so a caller can match its own <td> padding exactly
 * without fighting Tailwind class-order/specificity. `className` is for
 * anything else (width, text alignment, etc.) and is appended as usual.
 */
export default function SortableHeader({ label, column, sort, direction, onSort, className = '', padding = 'px-6 py-3' }) {
    if (!column || !onSort) {
        return <th className={`${padding} align-middle ${className}`}>{label}</th>;
    }

    const active = sort === column;

    return (
        <th className={`${padding} align-middle ${className}`}>
            <button
                type="button"
                onClick={() => onSort(column)}
                className="inline-flex items-center gap-1 whitespace-nowrap hover:text-gray-700 dark:hover:text-gray-200"
            >
                {label}
                <SortIcon active={active} direction={direction} />
            </button>
        </th>
    );
}
