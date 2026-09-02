import { useEffect, useMemo, useRef, useState } from 'react';

// Modeled on Discord's in-server search: typing a filter keyword like "from:"
// or "has:" locks it into a solid dark tag inside the bar (not just text)
// and opens a value list below it; picking a value turns the whole thing
// into a removable applied-filter pill. Each filter is single-select and
// shows as at most one applied pill; the interaction (keyword -> tag ->
// value list -> pill, backspace to pop the last tag/pill) mirrors Discord's
// flow across however many filters are passed in.

function SearchIcon() {
    return (
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function FilterTypeIcon() {
    // Small colon-tag glyph, echoes Discord's "from:" / "has:" suggestion rows.
    return (
        <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6" />
        </svg>
    );
}

// The keyword tag shown while a filter is mid-pick (before a value is
// chosen), and the applied-filter pill once a value's picked, share the
// same neutral gray palette across both light and dark theme - light gray
// on the white bar, a visibly lighter gray than the bar's own background in
// dark mode - rather than a stark black tag or an unrelated blue pill.
function KeywordTag({ keyword }) {
    return (
        <span className="inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded bg-gray-200 px-2 text-xs font-semibold leading-none text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            {keyword}:
        </span>
    );
}

function AppliedPill({ children, onRemove }) {
    return (
        <span className="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded bg-gray-200 pl-1.5 pr-1 text-xs font-medium leading-none text-gray-700 dark:bg-gray-700 dark:text-gray-100">
            {children}
            <button
                type="button"
                onClick={onRemove}
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                title="Remove filter"
            >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </span>
    );
}

// filters: [{ key, keyword, description, options: [{value,label}], value, onChange }]
// `value` is the filter's currently-applied option value, 'all' meaning unset.
export default function TaskSearchBar({ value, onChange, filters, placeholder = 'Search...', className = '' }) {
    const [open, setOpen] = useState(false);
    // The filter type currently locked into a dark keyword tag (e.g. after
    // typing "status:"), while its value is still being picked. Separate
    // from `value`/`onChange`, which stays the plain free-text search term.
    const [pendingType, setPendingType] = useState(null);
    const [pendingQuery, setPendingQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const appliedFilters = useMemo(() => filters.filter((f) => f.value !== 'all'), [filters]);
    const availableFilterTypes = useMemo(() => filters.filter((f) => f.value === 'all'), [filters]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const cancelPending = () => {
        setPendingType(null);
        setPendingQuery('');
    };

    const applyValue = (filterType, optionValue) => {
        filterType.onChange(optionValue);
        cancelPending();
        onChange('');
        setOpen(false);
        inputRef.current?.focus();
    };

    const lockKeyword = (filterType) => {
        setPendingType(filterType);
        setPendingQuery('');
        onChange('');
        setOpen(true);
        inputRef.current?.focus();
    };

    const handleTextChange = (raw) => {
        if (pendingType) {
            setPendingQuery(raw);
            return;
        }
        // Auto-lock into a keyword tag the moment a full "status:" / "priority:"
        // is typed, same as Discord converting a finished keyword into a tag.
        const fullMatch = raw.match(/^(\w+):(.*)$/);
        const matchedType = fullMatch && availableFilterTypes.find((f) => f.keyword === fullMatch[1].toLowerCase());
        if (matchedType) {
            setPendingType(matchedType);
            setPendingQuery(fullMatch[2] ?? '');
            onChange('');
            return;
        }
        onChange(raw);
    };

    const handleKeyDown = (e) => {
        if (e.key !== 'Backspace') return;
        if (pendingType) {
            if (pendingQuery === '') cancelPending();
            return;
        }
        if (value !== '') return;
        // Nothing typed - pop the most recently applied pill (last one in
        // the filters list order, mirrors Discord popping the last tag).
        if (appliedFilters.length > 0) appliedFilters[appliedFilters.length - 1].onChange('all');
    };

    const showValueList = Boolean(pendingType);
    const filteredOptions = showValueList
        ? pendingType.options.filter(
              (o) => o.label.toLowerCase().includes(pendingQuery.toLowerCase()) || o.value.toLowerCase().includes(pendingQuery.toLowerCase())
          )
        : [];
    const typedPrefix = value.trim().toLowerCase();
    const matchingFilterTypes = availableFilterTypes.filter((f) => f.keyword.startsWith(typedPrefix));
    const showKeywordSuggestions = !showValueList && matchingFilterTypes.length > 0;
    const showDropdown = open && (showValueList || showKeywordSuggestions);
    const inputValue = pendingType ? pendingQuery : value;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                className="flex h-9 min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-md border border-gray-300 bg-white px-2.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                onClick={() => inputRef.current?.focus()}
            >
                <SearchIcon />
                {appliedFilters.map((f) => (
                    <AppliedPill key={f.key} onRemove={() => f.onChange('all')}>
                        {f.keyword}: {f.options.find((o) => o.value === f.value)?.label ?? f.value}
                    </AppliedPill>
                ))}
                {pendingType && <KeywordTag keyword={pendingType.keyword} />}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => { handleTextChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={!pendingType && appliedFilters.length === 0 ? placeholder : ''}
                    className="min-w-[48px] flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100"
                />
            </div>

            {showDropdown && (
                <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {showValueList ? (
                        <div className="max-h-56 overflow-y-auto py-1">
                            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {pendingType.keyword}
                            </p>
                            {filteredOptions.length === 0 && (
                                <p className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500">No matches</p>
                            )}
                            {filteredOptions.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => applyValue(pendingType, o.value)}
                                    className="flex w-full items-center px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-1">
                            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                Filter by
                            </p>
                            {matchingFilterTypes.map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => lockKeyword(f)}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    <FilterTypeIcon />
                                    <span className="font-medium">{f.keyword}:</span>
                                    <span className="text-gray-400 dark:text-gray-500">{f.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
