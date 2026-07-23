// Icon presets an admin can assign to a feedback category. Keep this list in sync
// with FeedbackCategory::iconOptions() on the backend (validation source of truth).
const ICON_PATHS = {
    bug: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    flag: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H11l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
    question: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    lightbulb: 'M9 18h6m-5 3h4m-2-19a6 6 0 00-4 10.472V15a1 1 0 001 1h6a1 1 0 001-1v-2.528A6 6 0 0012 2z',
    dot: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    alert: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    lock: 'M16 10V7a4 4 0 00-8 0v3m-1 0h10a1 1 0 011 1v8a1 1 0 01-1 1H7a1 1 0 01-1-1v-8a1 1 0 011-1z',
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4zm6 2a4 4 0 10-4-4',
};

export const ICON_OPTIONS = [
    { key: 'bug', label: 'Bug' },
    { key: 'help', label: 'Help' },
    { key: 'flag', label: 'Flag' },
    { key: 'question', label: 'Question' },
    { key: 'lightbulb', label: 'Idea' },
    { key: 'star', label: 'Star' },
    { key: 'chat', label: 'Chat' },
    { key: 'mail', label: 'Mail' },
    { key: 'alert', label: 'Alert' },
    { key: 'lock', label: 'Lock' },
    { key: 'users', label: 'Users' },
    { key: 'dot', label: 'Other' },
];

export default function CategoryIcon({ icon, className = 'h-5 w-5' }) {
    const path = ICON_PATHS[icon] ?? ICON_PATHS.dot;
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

/**
 * Looks a feedback's stored category key up against the live categories list. Falls back
 * to the raw key (title-cased) so a ticket filed under a category an admin later deleted
 * still shows something readable instead of blank.
 */
export function resolveCategory(key, categories = []) {
    const found = categories.find((c) => c.key === key);
    if (found) return found;
    return { key, label: key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown', icon: 'dot' };
}
