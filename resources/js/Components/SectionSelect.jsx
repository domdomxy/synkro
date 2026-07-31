import { useEffect, useRef, useState } from 'react';

function Option({ item, selected, danger, onSelect }) {
    const baseClasses = danger
        ? selected
            ? 'bg-red-50 font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300'
            : 'text-red-500 hover:bg-red-50 dark:text-red-400/80 dark:hover:bg-red-950/20'
        : selected
            ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700';

    return (
        <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={onSelect}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${baseClasses}`}
        >
            <span className={`shrink-0 ${danger ? (selected ? 'text-red-500 dark:text-red-400' : 'text-red-400/70 dark:text-red-500/60') : selected ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {item.icon}
            </span>
            {item.label}
            {selected && (
                <svg className="ml-auto h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}

/**
 * Custom-styled stand-in for a native <select>, used as the mobile section
 * switcher in Settings, Help & Feedback, and Account. A plain <select>
 * renders with the OS's own dropdown chrome (plain list, no icons, no
 * theme awareness), which looks out of place against the rest of the
 * app's styled UI. This keeps the same "tap to open, tap an option to
 * switch sections" behavior while matching the app's own menu look
 * (icons, rounded panel, selected-state highlight + checkmark).
 *
 * Pass either a flat `items` array, or a `groups` array (e.g. Account's
 * "Account" / "Danger Zone" split) shaped as
 * `[{ label, items, danger? }, ...]` - danger groups render in red, same
 * as Account's desktop sidebar.
 */
export default function SectionSelect({ items, groups, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const flatItems = groups ? groups.flatMap((g) => g.items) : items;
    const active = flatItems.find((item) => item.id === value) ?? flatItems[0];

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [open]);

    const select = (id) => {
        onChange(id);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600"
            >
                <span className="flex items-center gap-2">
                    <span className="shrink-0 text-gray-400 dark:text-gray-500">{active?.icon}</span>
                    {active?.label}
                </span>
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
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    {groups
                        ? groups.map((group, i) => (
                              <div key={group.label} className={i > 0 ? 'mt-1 border-t border-gray-100 pt-1 dark:border-gray-700' : ''}>
                                  <p
                                      className={`px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide ${
                                          group.danger ? 'text-red-400 dark:text-red-500/80' : 'text-gray-400 dark:text-gray-500'
                                      }`}
                                  >
                                      {group.label}
                                  </p>
                                  {group.items.map((item) => (
                                      <Option key={item.id} item={item} selected={item.id === value} danger={group.danger} onSelect={() => select(item.id)} />
                                  ))}
                              </div>
                          ))
                        : items.map((item) => (
                              <Option key={item.id} item={item} selected={item.id === value} onSelect={() => select(item.id)} />
                          ))}
                </div>
            )}
        </div>
    );
}
