import { Link } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';

// Quick-toggle theme options shown inline in the account menu. Mirrors the
// first three choices on the full Settings > Appearance page (system, light,
// dark); "black" is a step further and stays a Settings-only choice so this
// row doesn't get crowded.
const QUICK_THEME_OPTIONS = [
    {
        id: 'system',
        label: 'System',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'light',
        label: 'Light',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.219 4.219l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
        ),
    },
    {
        id: 'dark',
        label: 'Dark',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
        ),
    },
];

function AccountIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function SettingsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.995.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function LogOutIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

function RoleBadge({ role }) {
    if (role !== 'admin' && role !== 'superadmin') {
        return null;
    }

    return (
        <span className="inline-flex w-fit rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {role === 'superadmin' ? 'Super Admin' : 'Admin'}
        </span>
    );
}

function MenuLink({ href, icon, children, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
            {icon}
            {children}
        </Link>
    );
}

/**
 * Profile card used both in the desktop avatar dropdown and the mobile
 * hamburger panel: avatar + name + email up top, an inline quick-theme
 * toggle, then Account/Settings links and Log Out at the bottom.
 */
export default function AccountMenu({ user, theme, onThemeChange, onNavigate }) {
    return (
        <div className="w-full">
            <div className="flex items-center gap-3 px-4 py-4">
                <Avatar user={user} size="h-11 w-11" rounded="rounded-full" />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    <div className="mt-1">
                        <RoleBadge role={user.role} />
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <div className="py-1">
                <MenuLink href={route('account.edit')} icon={<AccountIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />} onNavigate={onNavigate}>
                    Account
                </MenuLink>
                <MenuLink href={route('settings.edit')} icon={<SettingsIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />} onNavigate={onNavigate}>
                    Settings
                </MenuLink>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">Appearance</span>
                <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                    {QUICK_THEME_OPTIONS.map(({ id, label, icon }) => (
                        <button
                            key={id}
                            type="button"
                            title={label}
                            aria-pressed={theme === id}
                            onClick={() => onThemeChange(id)}
                            className={`rounded-md p-1.5 transition ${
                                theme === id
                                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                            }`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <div className="py-1">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    onClick={onNavigate}
                    className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-start text-sm text-red-600 transition duration-150 ease-in-out hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40"
                >
                    <LogOutIcon className="h-5 w-5" />
                    Log Out
                </Link>
            </div>
        </div>
    );
}
