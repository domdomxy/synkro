import { Link } from '@inertiajs/react';

export default function BackButton({ href, label = 'Back' }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {label}
        </Link>
    );
}