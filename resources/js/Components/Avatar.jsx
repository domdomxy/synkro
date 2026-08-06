const palette = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];

function colorFor(name) {
    const sum = (name || '?').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[sum % palette.length];
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

// `system` renders the app's own mark instead of a person's initials — for
// actions nothing human did (a scheduled job, not a since-deleted admin).
// Callers are responsible for telling the two apart (see e.g. Logs.jsx's
// AUTOMATED_ACTIONS) since a missing user/admin relation alone can't say
// which one it was.
//
// Uses the same two theme-matched SVGs as the browser tab favicon (see
// theme.js's FAVICON_BY_THEME) instead of ApplicationLogo - that component
// is a plain currentColor line-mark meant to sit directly on the page
// background at nav-bar size, not a filled badge shrunk down to avatar
// size, so it read as a generic squiggle rather than the actual logo once
// this small. The favicon SVGs are the real mark at a size this is already
// designed to work at.
export default function Avatar({ user, system = false, size = 'h-8 w-8', rounded = 'rounded-lg', className = '' }) {
    if (system) {
        return (
            <div className={`${size} flex items-center justify-center overflow-hidden ${rounded} bg-white ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:ring-gray-700 ${className}`}>
                <img src="/favicon-light.svg" alt="Synkro" className="h-[70%] w-[70%] object-contain dark:hidden" />
                <img src="/favicon-dark.svg" alt="Synkro" className="hidden h-[70%] w-[70%] object-contain dark:block" />
            </div>
        );
    }

    if (user?.avatar_path) {
        return <img src={`/storage/${user.avatar_path}`} alt={user.name} className={`${size} ${rounded} object-cover ${className}`} />;
    }

    return (
        <div className={`${size} flex items-center justify-center ${rounded} text-xs font-semibold text-white ${colorFor(user?.name)} ${className}`}>
            {initials(user?.name)}
        </div>
    );
}