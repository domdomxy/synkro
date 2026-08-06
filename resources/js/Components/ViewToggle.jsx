function ListIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function GridIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
    );
}

/**
 * List/card view switcher. `value` is 'list' | 'grid'; `onChange` receives the new value.
 * Persists nothing itself - the page decides whether/how to remember the choice.
 */
export default function ViewToggle({ value, onChange, className = '' }) {
    const base = 'flex h-7 w-7 items-center justify-center rounded transition';
    const active = 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400';
    const inactive = 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300';

    return (
        <div className={`inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
            <button
                type="button"
                onClick={() => onChange('list')}
                title="List view"
                aria-pressed={value === 'list'}
                className={`${base} ${value === 'list' ? active : inactive}`}
            >
                <ListIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => onChange('grid')}
                title="Card view"
                aria-pressed={value === 'grid'}
                className={`${base} ${value === 'grid' ? active : inactive}`}
            >
                <GridIcon className="h-4 w-4" />
            </button>
        </div>
    );
}
