import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import NotificationBell from '@/Components/NotificationBell';
import FlashMessages from '@/Components/FlashMessages';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [theme, setThemeState] = useState(getStoredTheme());

    const handleThemeChange = (value) => {
        setStoredTheme(value);
        setThemeState(value);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <FlashMessages />
            <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className=" mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink href={route('projects.index')} active={route().current('projects.*')}>
                                    Projects
                                </NavLink>
                                <NavLink href={route('tasks.index')} active={route().current('tasks.index')}>
                                    Tasks
                                </NavLink>
                                {user.role === 'admin' && (
                                    <NavLink href={route('admin.dashboard')} active={route().current('admin.*')}>
                                        Admin
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationBell />

                            <div className="hidden sm:flex sm:items-center">
                                <div className="relative ms-1">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    <Avatar user={user} size="h-6 w-6" />
                                                    {user.name}
                                                    <svg className="-me-0.5 ms-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link href={route('dashboard')}>Dashboard</Dropdown.Link>
                                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>

                                            <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
                                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Appearance</p>
                                                <div className="flex gap-1">
                                                    {['system', 'light', 'dark'].map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => handleThemeChange(option)}
                                                            className={`flex-1 rounded-md px-2 py-1 text-xs capitalize ${
                                                                theme === option
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="!text-red-600 dark:!text-red-400">
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            <div className="flex items-center sm:hidden">
                                <button
                                    onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                                >
                                    <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                        <path
                                            className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink href={route('projects.index')} active={route().current('projects.*')}>
                            Projects
                        </ResponsiveNavLink>
                        <ResponsiveNavLink href={route('tasks.index')} active={route().current('tasks.index')}>
                            Tasks
                        </ResponsiveNavLink>
                        {user.role === 'admin' && (
                            <ResponsiveNavLink href={route('admin.dashboard')} active={route().current('admin.*')}>
                                Admin
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="flex items-center gap-3 px-4">
                            <Avatar user={user} size="h-9 w-9" />
                            <div>
                                <div className="text-base font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                                <div className="text-sm font-medium text-gray-500">{user.email}</div>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('dashboard')}>Dashboard</ResponsiveNavLink>
                            <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>

                            {/* Appearance — was missing from mobile */}
                            <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Appearance</p>
                                <div className="flex gap-1">
                                    {['system', 'light', 'dark'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => handleThemeChange(option)}
                                            className={`flex-1 rounded-md px-2 py-1 text-xs capitalize ${
                                                theme === option
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ResponsiveNavLink method="post" href={route('logout')} as="button" className="!text-red-600 dark:!text-red-400">
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}