import { Link } from '@inertiajs/react';

// Icon set for the mobile bottom nav. Each icon has a lightweight outline
// glyph for its resting state and a filled/solid glyph for the active tab -
// the same dual-state convention iOS/Android tab bars use, so "you are
// here" reads instantly instead of relying on a subtle strokeWidth bump.
// All glyphs sit on the same 24x24 grid with a 1.6 stroke and rounded
// caps/joins so the set reads as one family; shapes lean on plain
// rects/polylines/polygons rather than freehand curves so they stay crisp
// at the small size they're actually rendered at in the bar.
function DashboardIcon({ className, active }) {
    return active ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="3" y="3" width="8" height="8" rx="2.25" />
            <rect x="13" y="3" width="8" height="5" rx="2.25" />
            <rect x="13" y="10" width="8" height="11" rx="2.25" />
            <rect x="3" y="13" width="8" height="8" rx="2.25" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
            <rect x="13" y="3.5" width="7.5" height="4.5" rx="2" />
            <rect x="13" y="10" width="7.5" height="10.5" rx="2" />
            <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
        </svg>
    );
}

function ProjectsIcon({ className, active }) {
    const path = 'M3.5 6.75c0-.97.78-1.75 1.75-1.75h3.69c.46 0 .91.18 1.24.51l1.02 1.02c.33.33.78.51 1.24.51h5.81c.97 0 1.75.78 1.75 1.75v8.25c0 .97-.78 1.75-1.75 1.75H5.25c-.97 0-1.75-.78-1.75-1.75V6.75z';
    return active ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={path} />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={path} />
        </svg>
    );
}

function TasksIcon({ className, active }) {
    return active ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="5.5" y="4.5" width="13" height="17" rx="2.5" />
            <rect x="9" y="3" width="6" height="3" rx="1" />
            <polyline points="8.5,13.2 10.6,15.3 15.5,10" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5.5" y="4.5" width="13" height="17" rx="2.5" />
            <rect x="9" y="3" width="6" height="3" rx="1" fill="currentColor" stroke="none" />
            <polyline points="8.5,13.2 10.6,15.3 15.5,10" />
        </svg>
    );
}

function TestingIcon({ className, active }) {
    return active ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 2.25a.9.9 0 000 1.8h.7v3.62l-4.13 6.6A2.35 2.35 0 006.55 18h10.9a2.35 2.35 0 002-3.73l-4.13-6.6V4.05h.7a.9.9 0 000-1.8H8zm7.1 10.85l1 1.6H7.9l1-1.6h6.2z" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="3" x2="16" y2="3" />
            <polygon points="9.5,3 14.5,3 14.5,8 18.5,19.5 5.5,19.5 9.5,8" />
            <line x1="6.9" y1="16" x2="17.1" y2="16" />
        </svg>
    );
}

function AdminIcon({ className, active }) {
    return active ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5l7.5 2.8v5.6c0 4.9-3.15 8.6-7.5 10.1-4.35-1.5-7.5-5.2-7.5-10.1V5.3L12 2.5z" />
            <polyline points="9,12 11,14.2 15.3,9.4" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l7 2.6v5.4c0 4.6-3 8.3-7 9.7-4-1.4-7-5.1-7-9.7V5.6L12 3z" />
            <polyline points="9,12 11,14.2 15.3,9.4" />
        </svg>
    );
}

const ICONS = {
    dashboard: DashboardIcon,
    projects: ProjectsIcon,
    tasks: TasksIcon,
    testing: TestingIcon,
    admin: AdminIcon,
};

/**
 * Icon + label bottom tab bar shown on mobile in place of the nav links
 * that used to live inside the avatar dropdown (see AccountMenu.jsx / the
 * `navLinks` prop it still supports for other callers). Fixed to the
 * bottom of the viewport, sm:hidden so it never shows on desktop where
 * the top nav already handles this. `links` is the same shape
 * AccountMenu's navLinks used: { href, label, active, badge, key }, with
 * `key` selecting the icon and `label` now doubling as the visible caption
 * under it (it was already being passed for aria-label/title, just never
 * rendered).
 *
 * Active state is communicated three ways at once - filled icon, accent
 * color on both icon and label, and a short bar riding the top border -
 * deliberately without a background pill behind the tab, so the row stays
 * free of extra boxes.
 */
export default function BottomNavBar({ links }) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 bg-white/95 shadow-[0_-1px_8px_rgba(0,0,0,0.05)] backdrop-blur dark:border-gray-700/80 dark:bg-gray-800/95 sm:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex h-[58px] items-stretch">
                {links.map((link) => {
                    const Icon = ICONS[link.key] ?? DashboardIcon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={link.active ? 'page' : undefined}
                            className="group relative flex flex-1 flex-col items-center justify-center gap-1 pt-1.5 focus:outline-none"
                        >
                            <span
                                className={`absolute inset-x-[22%] top-0 h-0.5 rounded-full bg-indigo-500 transition-opacity duration-150 dark:bg-indigo-400 ${
                                    link.active ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            <span
                                className={`relative inline-flex items-center justify-center transition-colors duration-150 ${
                                    link.active
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                                }`}
                            >
                                <Icon className="h-[21px] w-[21px]" active={link.active} />
                                {link.badge === 'dot' && (
                                    <span className="absolute right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                                )}
                                {typeof link.badge === 'number' && link.badge > 0 && (
                                    <span className="absolute -right-1 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-500 px-0.5 text-[9px] font-semibold leading-none text-white ring-2 ring-white dark:ring-gray-800">
                                        {link.badge > 99 ? '99+' : link.badge}
                                    </span>
                                )}
                            </span>
                            <span
                                className={`text-[10px] leading-none transition-colors duration-150 ${
                                    link.active
                                        ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                                        : 'font-medium text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                                }`}
                            >
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
