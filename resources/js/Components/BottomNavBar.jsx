import { Link } from '@inertiajs/react';

// Icon set for the mobile bottom nav. Kept in the same stroke/viewBox style
// as the icons in AccountMenu.jsx (outline, 24x24, strokeWidth 2) so the two
// menus feel like the same design language even though they now live in
// different places on mobile.
function DashboardIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10" />
        </svg>
    );
}

function ProjectsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293L12 7h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function TasksIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 9l2 2 4-4" />
        </svg>
    );
}

function TestingIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3v4.5L4.5 17.25a1.5 1.5 0 001.35 2.25h12.3a1.5 1.5 0 001.35-2.25L14.25 7.5V3M8.25 3h7.5M8.25 14.25h7.5" />
        </svg>
    );
}

function AdminIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
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
 * Icon-only bottom tab bar shown on mobile in place of the nav links that
 * used to live inside the avatar dropdown (see AccountMenu.jsx / the
 * `navLinks` prop it still supports for other callers). Fixed to the bottom
 * of the viewport, sm:hidden so it never shows on desktop where the top nav
 * already handles this. `links` is the same shape AccountMenu's navLinks
 * used: { href, label, active, badge, key }, with `key` selecting the icon.
 */
export default function BottomNavBar({ links }) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-800/95 sm:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex h-16 items-stretch">
                {links.map((link) => {
                    const Icon = ICONS[link.key] ?? DashboardIcon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-label={link.label}
                            aria-current={link.active ? 'page' : undefined}
                            title={link.label}
                            className={`flex flex-1 items-center justify-center transition focus:outline-none ${
                                link.active
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                            }`}
                        >
                            <span className="relative inline-flex">
                                <Icon className="h-6 w-6" />
                                {link.badge === 'dot' && (
                                    <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-red-500" />
                                )}
                                {typeof link.badge === 'number' && link.badge > 0 && (
                                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white">
                                        {link.badge > 99 ? '99+' : link.badge}
                                    </span>
                                )}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
