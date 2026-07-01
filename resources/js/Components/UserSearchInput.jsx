import Avatar from '@/Components/Avatar';
import { useEffect, useRef, useState } from 'react';

export default function UserSearchInput({ value, onChange, placeholder = 'Search by name or email...' }) {
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            fetch(`/users/search?q=${encodeURIComponent(value)}`)
                .then((res) => res.json())
                .then(setResults)
                .catch(() => setResults([]));
        }, 300);

        return () => clearTimeout(timer);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const pick = (user) => {
        onChange(user.email);
        setResults([]);
        setOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => results.length > 0 && setOpen(true)}
                placeholder={placeholder}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
            />
            {open && results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    {results.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => pick(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <Avatar user={user} size="h-6 w-6" />
                            <span>
                                <span className="block text-gray-800 dark:text-gray-200">{user.name}</span>
                                <span className="block text-xs text-gray-400 dark:text-gray-500">{user.email}</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}