import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Dropdown from '@/Components/Dropdown';
import AccountMenu from '@/Components/AccountMenu';
import NavLink from '@/Components/NavLink';
import NotificationBell from '@/Components/NotificationBell';
import FlashMessages from '@/Components/FlashMessages';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useEcho } from '@laravel/echo-react';
import SuspensionListener from '@/Components/SuspensionListener';
import AccountDeletedListener from '@/Components/AccountDeletedListener';
import PasswordResetListener from '@/Components/PasswordResetListener';
import useRouteOverlay, { RouteOverlayActionsContext } from '@/hooks/useRouteOverlay';
import SettingsPanel from '@/Components/SettingsPanel';
import AccountPanel from '@/Components/AccountPanel';
import FeedbackPanel from '@/Components/FeedbackPanel';

// Route overlay panels reached from the account menu / Settings sidebar.
// Keyed the same way useRouteOverlay's `open(key, url)` is called below.
const OVERLAY_PANELS = {
    settings: SettingsPanel,
    account: AccountPanel,
    feedback: FeedbackPanel,
};

export default function AuthenticatedLayout({ header, headerMaxWidth = 'max-w-7xl', children }) {
    const user = usePage().props.auth.user;
    // Superadmins carry every admin permission plus a few of their own (see
    // User::isAdmin() on the backend), so anywhere "is this user an admin"
    // gates something in the UI, superadmin must count too — otherwise a
    // superadmin loses access to admin-only nav/UI just because their role
    // string is 'superadmin' rather than literally 'admin'.
    const isAdminRole = user.role === 'admin' || user.role === 'superadmin';
    const { adminAlerts, testing } = usePage().props;
    const { version } = usePage();
    const [hasPendingAlert, setHasPendingAlert] = useState(adminAlerts?.hasPending ?? false);
    const [pendingTestCount, setPendingTestCount] = useState(testing?.pendingCount ?? 0);
    const [theme, setThemeState] = useState(getStoredTheme());
    const { overlay, open: openOverlay, close: closeOverlay } = useRouteOverlay();
    const openSettings = () => openOverlay('settings', route('settings.edit'), version);
    const openAccount = () => openOverlay('account', route('account.edit'), version);
    // Used when a panel links to the other panel (Settings <-> Account)
    // instead of opening fresh from the account menu - reuses the current
    // back-stack entry (see useRouteOverlay) instead of pushing a new one.
    // An optional `section` (e.g. from a cross-panel search result) is
    // forwarded as `initialSection` so the target panel opens directly on
    // that section instead of always landing on its first tab.
    const switchToSettings = (section) => openOverlay('settings', route('settings.edit'), version, {
        replace: true,
        extraProps: section ? { initialSection: section } : undefined,
    });
    const switchToAccount = (section) => openOverlay('account', route('account.edit'), version, {
        replace: true,
        extraProps: section ? { initialSection: section } : undefined,
    });
    // Support's two entry points both go to the same route; `tab` just
    // seeds which one FeedbackPanel opens on (see its initialTab prop).
    const switchToFeedback = (tab) => openOverlay(
        'feedback',
        route('feedback.page', { from: 'settings' }),
        version,
        { replace: true, extraProps: { initialTab: tab } },
    );
    const OverlayPanel = overlay ? OVERLAY_PANELS[overlay.key] : null;

    const handleThemeChange = (value) => {
        setStoredTheme(value);
        setThemeState(value);
    };

    useEffect(() => {
        setHasPendingAlert(adminAlerts?.hasPending ?? false);
    }, [adminAlerts]);

    useEffect(() => {
        setPendingTestCount(testing?.pendingCount ?? 0);
    }, [testing]);

    // Private per-user channel, always valid here since AuthenticatedLayout only
    // renders for a logged-in user — unlike admin-alerts below, no fallback needed.
    useEcho(
        `user.${user.id}`,
        ['.testing.queue-updated'],
        (payload) => setPendingTestCount(payload.pendingCount),
        [user.id],
    );

    // useEcho always subscribes on mount, even when given a falsy channel
    // name (it does not skip subscribing, it just subscribes to the literal
    // string "private-null"), so it can't be disabled by passing null. Since
    // React hooks can't be called conditionally either, we always pass a
    // real channel name and instead gate the *effect* of the event on the
    // user's role inside the callback.
    useEcho(
        'admin-alerts',
        ['.alerts.updated'],
        (payload) => {
            if (!isAdminRole) {
                return;
            }

            setHasPendingAlert(Boolean(payload.hasPending));
        },
        [],
        isAdminRole ? 'private' : 'public'
    );

    // Previously shown behind a separate hamburger button on mobile; now rendered
    // inside the account dropdown, which opens from tapping the avatar instead.
    const mobileNavLinks = [
        { href: route('dashboard'), label: 'Dashboard', active: route().current('dashboard') },
        { href: route('projects.index'), label: 'Projects', active: route().current('projects.*') },
        { href: route('tasks.index'), label: 'Tasks', active: route().current('tasks.index') },
        ...(testing ? [{ href: route('testing.index'), label: 'Testing', active: route().current('testing.index'), badge: pendingTestCount > 0 ? pendingTestCount : undefined }] : []),
        ...(isAdminRole ? [{ href: route('admin.dashboard'), label: 'Admin', active: route().current('admin.*'), badge: hasPendingAlert ? 'dot' : undefined }] : []),
    ];

    return (
        <RouteOverlayActionsContext.Provider value={{ openSettings, openAccount, switchToSettings, switchToAccount, switchToFeedback }}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <FlashMessages />
            <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/50 backdrop-blur dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-10">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800 dark:text-gray-200" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                                    Dashboard
                                </NavLink>
                                <NavLink href={route('projects.index')} active={route().current('projects.*')}>
                                    Projects
                                </NavLink>
                                <NavLink href={route('tasks.index')} active={route().current('tasks.index')}>
                                    Tasks
                                </NavLink>
                                {testing && (
                                    <div className="relative inline-flex">
                                        <NavLink href={route('testing.index')} active={route().current('testing.index')}>
                                            Testing
                                        </NavLink>
                                        {pendingTestCount > 0 && (
                                            <span className="pointer-events-none absolute -right-3 top-3.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white">
                                                {pendingTestCount > 99 ? '99+' : pendingTestCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {isAdminRole && (
                                    <div className="relative inline-flex">
                                        <NavLink href={route('admin.dashboard')} active={route().current('admin.*')}>
                                            Admin
                                        </NavLink>
                                        {hasPendingAlert && (
                                            <span className="pointer-events-none absolute -right-1 top-5 h-2 w-2 rounded-full bg-red-500" />
                                        )}
                                    </div>
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
                                                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-white/30 px-3 py-2 text-sm font-medium leading-4 text-gray-500 backdrop-blur transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800/30 dark:text-gray-400 dark:hover:text-gray-300"
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

                                        <Dropdown.Content width="72" contentClasses="py-2 bg-white dark:bg-gray-800">
                                            <AccountMenu user={user} theme={theme} onThemeChange={handleThemeChange} onOpenSettings={openSettings} onOpenAccount={openAccount} />
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            <div className="relative -me-2 flex items-center sm:hidden">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button type="button" className="flex items-center rounded-full p-2">
                                            <Avatar user={user} size="h-8 w-8" />
                                        </button>
                                    </Dropdown.Trigger>

                                    {/* align="right" anchors the panel's right edge to the trigger's
                                        right edge (end-0); the negative margin on the wrapper above
                                        pulls the trigger itself flush with the screen edge, so the
                                        panel opens right at the edge instead of leaving a gap where
                                        the hamburger used to sit. */}
                                    <Dropdown.Content align="right" width="72" contentClasses="py-2 bg-white dark:bg-gray-800">
                                        <AccountMenu user={user} theme={theme} onThemeChange={handleThemeChange} navLinks={mobileNavLinks} onOpenSettings={openSettings} onOpenAccount={openAccount} />
                                    </Dropdown.Content>
                                </Dropdown>
                                {/* Testing/Admin badges live inside the menu, so surface a plain dot
                                    on the trigger itself - otherwise there'd be no hint anything
                                    needs attention until it's opened. */}
                                {(hasPendingAlert || pendingTestCount > 0) && (
                                    <span className="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <SuspensionListener />
            <AccountDeletedListener />
            <PasswordResetListener />
            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className={`mx-auto ${headerMaxWidth} px-4 py-6 sm:px-6 lg:px-8`}>{header}</div>
                </header>
            )}

            <main>{children}</main>

            {OverlayPanel && <OverlayPanel {...overlay.props} onClose={closeOverlay} />}
        </div>
        </RouteOverlayActionsContext.Provider>
    );

}