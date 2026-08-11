import { useState } from 'react';

const PRESETS = [5, 10, 30];
const MAX_PER_PAGE = 500;

/**
 * Per-page selector for paginated admin tables.
 * Renders preset buttons (10 / 30 / 100) plus a "Custom" option that reveals
 * a number input. Calls onChange(value) whenever the effective page size changes.
 */
export default function PerPageSelect({ value, onChange }) {
    const isPreset = PRESETS.includes(Number(value));
    const [showCustom, setShowCustom] = useState(!isPreset);
    const [customValue, setCustomValue] = useState(isPreset ? '' : String(value ?? ''));

    const handlePresetClick = (preset) => {
        setShowCustom(false);
        onChange(preset);
    };

    const openCustom = () => {
        setShowCustom(true);
        setCustomValue(isPreset ? '' : String(value ?? ''));
    };

    const submitCustom = () => {
        const parsed = parseInt(customValue, 10);
        if (!parsed || parsed < 1) return;
        onChange(Math.min(parsed, MAX_PER_PAGE));
    };

    const pillClass = (active) =>
        `rounded-md px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-3 sm:py-1.5 sm:text-sm ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500'
        }`;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">Show</span>
            {PRESETS.map((preset) => (
                <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={pillClass(!showCustom && Number(value) === preset)}
                >
                    {preset}
                </button>
            ))}
            <button
                type="button"
                onClick={openCustom}
                className={pillClass(showCustom)}
            >
                Custom
            </button>
            {showCustom && (
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min="1"
                        max={MAX_PER_PAGE}
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
                        placeholder="e.g. 50"
                        className="w-16 rounded-md border-gray-300 py-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 sm:w-20 sm:py-1.5 sm:text-sm"
                    />
                    <button
                        type="button"
                        onClick={submitCustom}
                        className="rounded-md border border-gray-300 px-1.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 sm:px-2 sm:py-1.5"
                    >
                        Go
                    </button>
                </div>
            )}
        </div>
    );
}
