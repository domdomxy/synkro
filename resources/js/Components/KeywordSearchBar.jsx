import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// Modeled on Discord's in-server search: typing a filter keyword like "from:"
// or "has:" locks it into a solid dark tag inside the bar (not just text)
// and opens a panel below it; picking/typing a value turns the whole thing
// into a removable applied-filter pill. Backspace pops the last tag/pill.
//
// Each filter is one of three kinds:
//   - 'select' (default): a fixed option list, single-select - e.g. status.
//     value/onChange carry the option's value ('all' means unset).
//   - 'text': free text typed after the keyword, matched elsewhere (e.g.
//     against comment bodies). value/onChange carry a plain string ('' means
//     unset). Applied by pressing Enter.
//   - 'typed-text': an optional type chip (from `types`) plus free text -
//     e.g. "deliverables: file · mockup". value/onChange carry
//     { type: string|null, text: string }, applied by pressing Enter once
//     either part is filled in.
//
// Filters can also carry a `category` (e.g. "Tasks") to group related
// keywords under a shared header in the "Filter by" suggestion list;
// filters without a category are listed individually beneath any groups.
//
// Live "type to search" matches (plain text, no keyword) are NOT shown in
// this bar's own dropdown - they're rendered as their own page-like panel
// elsewhere (see SearchResultsPanel.jsx / Projects/Show.jsx), Discord's
// dedicated search-results pane being the reference. This component only
// ever pops open the "Filter by" keyword list and a filter's value picker.

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

function filterKind(f) {
    return f.kind || 'select';
}

function isFilterApplied(f) {
    const kind = filterKind(f);
    if (kind === 'text') return typeof f.value === 'string' && f.value.trim() !== '';
    if (kind === 'typed-text') return Boolean(f.value?.type) || Boolean(f.value?.text && f.value.text.trim() !== '');
    return f.value !== 'all';
}

function emptyValueFor(f) {
    const kind = filterKind(f);
    if (kind === 'text') return '';
    if (kind === 'typed-text') return { type: null, text: '' };
    return 'all';
}

function appliedLabel(f) {
    const kind = filterKind(f);
    if (kind === 'select') return `${f.keyword}: ${f.options.find((o) => o.value === f.value)?.label ?? f.value}`;
    if (kind === 'text') return `${f.keyword}: "${f.value}"`;
    const typeLabel = f.value?.type ? f.types.find((t) => t.value === f.value.type)?.label : null;
    const parts = [typeLabel, f.value?.text].filter(Boolean);
    return `${f.keyword}: ${parts.length ? parts.join(' \u00b7 ') : '(any)'}`;
}

// filters: [{ key, keyword, description, category?, kind?, options?, types?, value, onChange }]
export default function KeywordSearchBar({ value, onChange, filters, placeholder = 'Search...', className = '' }) {
    const [open, setOpen] = useState(false);
    // The filter type currently locked into a dark keyword tag (e.g. after
    // typing "status:"), while its value is still being picked. Separate
    // from `value`/`onChange`, which stays the plain free-text search term.
    const [pendingType, setPendingType] = useState(null);
    // Only meaningful for a 'typed-text' filter: the type chip chosen so
    // far (e.g. "file"), before the free-text part is applied.
    const [pendingSubType, setPendingSubType] = useState(null);
    const [pendingQuery, setPendingQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    // On mobile the panel below is `fixed` (viewport-relative) rather than `absolute`
    // (bar-relative) so it can sit centered on the screen instead of off to one side of
    // a bar that no longer spans the same fixed width - see the panel's own comment.
    // `top` has to be measured in JS since a fixed element ignores the bar's position.
    const [mobileDropdownTop, setMobileDropdownTop] = useState(0);

    const appliedFilters = useMemo(() => filters.filter(isFilterApplied), [filters]);
    const availableFilterTypes = useMemo(() => filters.filter((f) => !isFilterApplied(f)), [filters]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    const cancelPending = () => {
        setPendingType(null);
        setPendingSubType(null);
        setPendingQuery('');
    };

    const applyValue = (filterType, optionValue) => {
        filterType.onChange(optionValue);
        cancelPending();
        onChange('');
        setOpen(false);
        inputRef.current?.focus();
    };

    // Applies a 'text' or 'typed-text' filter from whatever's currently
    // typed/chosen. No-op if there's nothing to apply yet.
    const applyPending = () => {
        if (!pendingType) return;
        const kind = filterKind(pendingType);
        if (kind === 'text') {
            if (pendingQuery.trim() === '') return;
            pendingType.onChange(pendingQuery);
        } else if (kind === 'typed-text') {
            if (!pendingSubType && pendingQuery.trim() === '') return;
            pendingType.onChange({ type: pendingSubType, text: pendingQuery });
        } else {
            return;
        }
        cancelPending();
        onChange('');
        setOpen(false);
        inputRef.current?.focus();
    };

    const lockKeyword = (filterType) => {
        setPendingType(filterType);
        setPendingSubType(null);
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
            setPendingSubType(null);
            setPendingQuery(fullMatch[2] ?? '');
            onChange('');
            return;
        }
        onChange(raw);
    };

    const handleKeyDown = (e) => {
        const kind = pendingType ? filterKind(pendingType) : null;

        if (e.key === 'Enter' && pendingType && (kind === 'text' || kind === 'typed-text')) {
            e.preventDefault();
            applyPending();
            return;
        }

        if (e.key !== 'Backspace') return;
        if (pendingType) {
            if (pendingQuery === '') {
                if (kind === 'typed-text' && pendingSubType) {
                    setPendingSubType(null);
                } else {
                    cancelPending();
                }
            }
            return;
        }
        if (value !== '') return;
        // Nothing typed - pop the most recently applied pill (last one in
        // the filters list order, mirrors Discord popping the last tag).
        if (appliedFilters.length > 0) {
            const last = appliedFilters[appliedFilters.length - 1];
            last.onChange(emptyValueFor(last));
        }
    };

    const pendingKind = pendingType ? filterKind(pendingType) : null;
    const showValueList = Boolean(pendingType) && pendingKind === 'select';
    const showTextPanel = Boolean(pendingType) && (pendingKind === 'text' || pendingKind === 'typed-text');
    const filteredOptions = showValueList
        ? pendingType.options.filter(
              (o) => o.label.toLowerCase().includes(pendingQuery.toLowerCase()) || o.value.toLowerCase().includes(pendingQuery.toLowerCase())
          )
        : [];
    const typedPrefix = value.trim().toLowerCase();
    // Only worth suggesting keywords while what's typed so far could still
    // be the start of one (e.g. "stat" -> "status:") - once it's longer than
    // any known keyword it's unambiguously free text, whose matches live in
    // SearchResultsPanel instead of this bar's own dropdown.
    const matchingFilterTypes = availableFilterTypes.filter((f) => f.keyword.startsWith(typedPrefix));
    const showKeywordSuggestions = !showValueList && !showTextPanel && !pendingType && matchingFilterTypes.length > 0;
    const showDropdown = open && (showValueList || showTextPanel || showKeywordSuggestions);

    // Re-measures the bar's bottom edge whenever the mobile panel opens, and keeps it
    // in sync if the page scrolls or resizes while it's open (e.g. rotating the device,
    // or the sticky header hiding/showing on scroll - see AuthenticatedLayout).
    useLayoutEffect(() => {
        if (!showDropdown) return;
        const updatePosition = () => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) setMobileDropdownTop(rect.bottom + 6);
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [showDropdown]);
    const inputValue = pendingType ? pendingQuery : value;

    // Group the "Filter by" suggestion list by category (e.g. "Tasks"),
    // preserving first-seen order; filters without a category are listed
    // individually underneath any groups.
    const categoryOrder = [];
    const categorized = {};
    const uncategorized = [];
    matchingFilterTypes.forEach((f) => {
        if (f.category) {
            if (!categorized[f.category]) {
                categorized[f.category] = [];
                categoryOrder.push(f.category);
            }
            categorized[f.category].push(f);
        } else {
            uncategorized.push(f);
        }
    });

    const canApplyPending = pendingKind === 'typed-text' ? Boolean(pendingSubType) || pendingQuery.trim() !== '' : pendingQuery.trim() !== '';

    const renderFilterTypeRow = (f) => (
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
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                className="flex h-9 min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-md border border-gray-300 bg-white px-2.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                onClick={() => inputRef.current?.focus()}
            >
                <SearchIcon />
                {appliedFilters.map((f) => (
                    <AppliedPill key={f.key} onRemove={() => f.onChange(emptyValueFor(f))}>
                        {appliedLabel(f)}
                    </AppliedPill>
                ))}
                {pendingType && <KeywordTag keyword={pendingType.keyword} />}
                {pendingKind === 'typed-text' && pendingSubType && (
                    <AppliedPill onRemove={() => setPendingSubType(null)}>
                        {pendingType.types.find((t) => t.value === pendingSubType)?.label}
                    </AppliedPill>
                )}
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

            {showDropdown && (() => {
                const dropdownBody = (
                    <>
                    {showValueList && (
                        <div className="thin-scrollbar max-h-72 overflow-y-auto py-1">
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
                    )}

                    {showTextPanel && (
                        <div className="thin-scrollbar max-h-80 overflow-y-auto py-1">
                            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {pendingType.keyword}
                            </p>
                            {pendingKind === 'typed-text' && !pendingSubType && (
                                <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                                    {pendingType.types.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setPendingSubType(t.value)}
                                            className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={applyPending}
                                disabled={!canApplyPending}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <FilterTypeIcon />
                                <span>
                                    {canApplyPending
                                        ? `Press Enter to apply${pendingQuery ? ` \u2014 "${pendingQuery}"` : ''}`
                                        : `Type to search ${pendingType.keyword}`}
                                </span>
                            </button>
                        </div>
                    )}

                    {showKeywordSuggestions && (
                        <div className="thin-scrollbar max-h-72 divide-y divide-gray-100 overflow-y-auto py-1 dark:divide-gray-700">
                            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                Filter by
                            </p>
                            {categoryOrder.map((cat) => (
                                <div key={cat} className="pt-1 first:pt-0">
                                    <p className="px-3 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                        {cat}
                                    </p>
                                    {categorized[cat].map(renderFilterTypeRow)}
                                </div>
                            ))}
                            {uncategorized.map(renderFilterTypeRow)}
                        </div>
                    )}
                    </>
                );

                return (
                    <>
                        {/* Mobile: fixed to the viewport and centered on screen (see mobileDropdownTop
                            above), capped to a viewport-relative width - since the bar itself can now
                            span most of the header width (see Projects/Show.jsx), anchoring to its own
                            edge no longer lands anywhere near the middle of the screen. */}
                        <div
                            className="fixed left-1/2 z-20 w-[min(92vw,22rem)] -translate-x-1/2 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:hidden"
                            style={{ top: mobileDropdownTop }}
                        >
                            {dropdownBody}
                        </div>
                        {/* Desktop: anchored to the bar's own right edge, and now sized to match
                            the bar's own width (w-full off this relative container) rather than a
                            fixed w-96 - the old fixed width was wider than some bars (e.g. Projects
                            Index's w-72 search bar), so it hung off past their left edge over
                            whatever sat beside/behind them. min-w guards the narrowest bars. */}
                        <div className="absolute right-0 top-full z-20 mt-1 hidden w-full min-w-[16rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:block">
                            {dropdownBody}
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
