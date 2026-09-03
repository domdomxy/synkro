// Presents the project search bar's live "type to search" matches as their
// own panel (Discord's in-server search-results pane was the reference),
// instead of a small list tucked under the search bar's dropdown. Swapped
// into the right-hand column in Projects/Show.jsx whenever there's a typed
// query, replacing NotesPanel until the search is cleared.

const GROUP_ICONS = {
    tasks: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M2 12v6a2 2 0 002 2h12" />
        </svg>
    ),
    comments: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
    ),
    members: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-9.13a4 4 0 110 8 4 4 0 010-8zM17.5 8.5a3 3 0 110 6" />
        </svg>
    ),
    resources: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
    ),
    deliverables: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
    ),
};

function GroupIcon({ groupKey }) {
    return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {GROUP_ICONS[groupKey] ?? GROUP_ICONS.tasks}
        </span>
    );
}

function ResultRow({ groupKey, primary, secondary, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            <GroupIcon groupKey={groupKey} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-gray-800 dark:text-gray-100">{primary}</span>
                {secondary && (
                    <span className="block truncate text-xs text-gray-400 dark:text-gray-500">{secondary}</span>
                )}
            </span>
        </button>
    );
}

// groups: [{ key, label, items: [{ id, primary, secondary?, onSelect }] }]
export default function SearchResultsPanel({ query, groups, onClear }) {
    const nonEmptyGroups = groups.filter((g) => g.items.length > 0);
    const totalCount = nonEmptyGroups.reduce((sum, g) => sum + g.items.length, 0);

    return (
        <div className="min-w-0 rounded-lg bg-white shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-700">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Results for &quot;{query}&quot;
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {totalCount} {totalCount === 1 ? 'result' : 'results'}
                    </p>
                </div>
                <button
                    onClick={onClear}
                    title="Clear search"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="thin-scrollbar max-h-[70vh] overflow-y-auto p-2 lg:max-h-[calc(100vh-260px)]">
                {nonEmptyGroups.length === 0 && (
                    <p className="px-2 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        No results found.
                    </p>
                )}
                {nonEmptyGroups.map((group) => (
                    <div key={group.key} className="mb-1 last:mb-0">
                        <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {group.label} &middot; {group.items.length}
                        </p>
                        {group.items.map((item) => (
                            <ResultRow
                                key={item.id}
                                groupKey={group.key}
                                primary={item.primary}
                                secondary={item.secondary}
                                onClick={item.onSelect}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
