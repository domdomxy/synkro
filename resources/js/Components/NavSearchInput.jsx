import { useEffect, useRef, useState } from 'react';

function SearchIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    );
}

function ClearIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// Wraps the substring of `text` that case-insensitively matches `query` in a
// highlighted <mark>, same idea as Claude.ai's own settings search results.
function Highlighted({ text, query }) {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
        <>
            {text.slice(0, i)}
            <mark className="rounded-sm bg-transparent font-semibold text-indigo-600 dark:text-indigo-400">{text.slice(i, i + query.length)}</mark>
            {text.slice(i + query.length)}
        </>
    );
}

/**
 * Search box for the Settings/Account nav sidebars. Unlike a plain "filter
 * the list" box, this searches each section's `terms` (the actual field/
 * control names living inside that section, e.g. "Full name", "New
 * Password") and surfaces a section as a match whenever any of its terms
 * contain the query - not just when the section's own label does. Matches
 * render as a dropdown of results (icon + section label + the matching
 * term, highlighted) below the input, same shape as Claude.ai's own
 * Settings search. Picking a result jumps to that section and clears the
 * search; it doesn't filter the nav list itself, which stays exactly as it
 * was underneath.
 *
 * `items` is [{ id, label, icon, terms: [string, ...] }, ...]. `terms`
 * should include the section's own label so searching for it still works.
 */
export default function NavSearchInput({ items, onSelect, placeholder = 'Search' }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [open]);

    const q = query.trim().toLowerCase();
    const results = q
        ? items
              .map((item) => ({ item, term: item.terms.find((t) => t.toLowerCase().includes(q)) }))
              .filter((r) => r.term)
        : [];

    const select = (id) => {
        onSelect(id);
        setQuery('');
        setOpen(false);
    };

    const clear = () => {
        setQuery('');
        setOpen(false);
    };

    return (
        <div className="relative mb-2 shrink-0" ref={containerRef}>
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => query && setOpen(true)}
                onKeyDown={(e) => e.key === 'Escape' && clear()}
                placeholder={placeholder}
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-7 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
            />
            {query && (
                <button
                    type="button"
                    onClick={clear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                    <ClearIcon className="h-3.5 w-3.5" />
                    <span className="sr-only">Clear search</span>
                </button>
            )}

            {open && q && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {results.length > 0 ? (
                        results.map(({ item, term }) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => select(item.id)}
                                className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/60"
                            >
                                <span className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500">{item.icon}</span>
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                                    {term.toLowerCase() !== item.label.toLowerCase() && (
                                        <span className="block truncate text-xs text-gray-400 dark:text-gray-500">
                                            <Highlighted text={term} query={q} />
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results found</p>
                    )}
                </div>
            )}
        </div>
    );
}
