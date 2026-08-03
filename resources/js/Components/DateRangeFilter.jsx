import { useState } from 'react';

export default function DateRangeFilter({ from, to, onApply }) {
    const [showCustom, setShowCustom] = useState(Boolean(from || to));
    const [customFrom, setCustomFrom] = useState(from ?? '');
    const [customTo, setCustomTo] = useState(to ?? '');

    const applyCustom = () => {
        if (customFrom && customTo) onApply(customFrom, customTo);
    };

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Date range</p>
                {(from || to) && (
                    <button type="button" onClick={() => { setCustomFrom(''); setCustomTo(''); onApply('', ''); }} className="text-xs text-gray-400 hover:underline dark:text-gray-500">
                        Clear dates
                    </button>
                )}
            </div>
            <button
                type="button"
                onClick={() => setShowCustom((v) => !v)}
                className={`rounded-md px-3 py-1.5 text-xs ${from || to ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
            >
                Custom
            </button>
            {showCustom && (
                <div className="mt-1.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-0 min-w-0 flex-1 rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                        <span className="shrink-0 text-xs text-gray-400">to</span>
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-0 min-w-0 flex-1 rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    </div>
                    <button type="button" onClick={applyCustom} className="w-full rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500">Go</button>
                </div>
            )}
        </div>
    );
}
