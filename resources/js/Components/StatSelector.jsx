import { useEffect, useRef, useState } from 'react';

function CheckboxRow({ item, checked, onToggle }) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={checked}
            onClick={onToggle}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
            <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                    checked
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                }`}
            >
                {checked && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </span>
            {item.icon && <span className="shrink-0 text-gray-400 dark:text-gray-500">{item.icon}</span>}
            {item.label}
        </button>
    );
}

/**
 * Multi-select "reference cards" picker for dashboard stat grids. Lets
 * someone choose which optional stat cards (e.g. Completed Projects) appear
 * alongside the fixed ones, remembered per-browser via localStorage so the
 * choice survives a refresh.
 *
 * Visually and behaviorally it borrows straight from SectionSelect (the
 * custom dropdown used as the mobile section switcher in Settings, Help &
 * Feedback, and Account) - a bordered button trigger with a floating panel -
 * but stays multi-select: toggling an option doesn't close the panel, and
 * the trigger shows a count badge instead of the single active label.
 */
export default function StatSelector({ options, storageKey, label = 'Reference Cards', onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const [selected, setSelected] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = window.localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        // Drop any ids that no longer exist in `options`, so a stale
                        // stored value can't render a phantom checked-but-missing card.
                        return parsed.filter((id) => options.some((o) => o.id === id));
                    }
                }
            } catch {
                // Malformed/unavailable storage falls back to the defaults below.
            }
        }
        return options.filter((o) => o.defaultOn).map((o) => o.id);
    });

    useEffect(() => {
        onChange?.(selected);
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(selected));
        } catch {
            // Storage may be unavailable (private browsing, quota) - the
            // selection still works for the rest of this session either way.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    useEffect(() => {
        if (!open) return;
        const handler = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggle = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
            >
                <svg className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M4.5 9h15M4.5 15h15" />
                </svg>
                {label}
                {selected.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-100 px-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {selected.length}
                    </span>
                )}
                <svg
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-multiselectable="true"
                    className="absolute right-0 top-full z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    <p className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Optional stat cards
                    </p>
                    {options.map((item) => (
                        <CheckboxRow key={item.id} item={item} checked={selected.includes(item.id)} onToggle={() => toggle(item.id)} />
                    ))}
                </div>
            )}
        </div>
    );
}
