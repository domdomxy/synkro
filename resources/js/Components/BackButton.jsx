import { router } from '@inertiajs/react';

// Uses real browser back navigation instead of always pushing a fresh
// history entry for `href`. Pushing unconditionally (the old <Link>
// behavior) makes the history stack grow every time this is clicked
// (e.g. Show -> Settings -> [Back to Project, pushes Show again] ->
// Settings), so a subsequent browser/mobile back step lands on the
// page you just left instead of where you actually came from. Falling
// back to `href` covers direct loads (deep links, refreshes) where
// there's no in-app history to go back to.
export default function BackButton({ href, label = 'Back' }) {
    const handleClick = (e) => {
        e.preventDefault();
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(href);
        }
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            aria-label={label}
            title={label}
            className="inline-flex items-center gap-2 rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 sm:rounded-md sm:bg-gray-800 sm:px-4 sm:py-2 sm:text-sm sm:font-semibold sm:text-white sm:shadow sm:hover:bg-gray-700 sm:dark:bg-gray-700 sm:dark:hover:bg-gray-600"
        >
            <svg className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{label}</span>
        </a>
    );
}
