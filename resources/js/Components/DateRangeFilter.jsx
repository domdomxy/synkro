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
            <label className="mb-1 block text-xs text-gray-400 dark:text-gray-500">Date range</label>
            <div className="flex flex-wrap items-center gap-1">
                <button
                    type="button"
                    onClick={() => setShowCustom((v) => !v)}
                    className={`rounded-md px-3 py-1.5 text-xs ${from || to ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                >
                    Custom
                </button>
                {showCustom && (
                    <div className="flex items-center gap-1">
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                        <span className="text-xs text-gray-400">to</span>
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                        <button type="button" onClick={applyCustom} className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500">Go</button>
                    </div>
                )}
                {(from || to) && (
                    <button type="button" onClick={() => { setCustomFrom(''); setCustomTo(''); onApply('', ''); }} className="px-2 text-xs text-gray-400 hover:underline dark:text-gray-500">
                        Clear dates
                    </button>
                )}
            </div>
        </div>
    );
}
