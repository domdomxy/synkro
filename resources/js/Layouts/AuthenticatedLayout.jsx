import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Dropdown from '@/Components/Dropdown';
import AccountMenu from '@/Components/AccountMenu';
import BottomNavBar from '@/Components/BottomNavBar';
import NavLink from '@/Components/NavLink';
import NotificationBell from '@/Components/NotificationBell';
import ToastLayer from '@/Components/ToastLayer';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useEcho } from '@laravel/echo-react';
import SuspensionListener from '@/Components/SuspensionListener';
import AccountDeletedListener from '@/Components/AccountDeletedListener';
import AccountDeactivatedListener from '@/Components/AccountDeactivatedListener';
import DeviceDisconnectedListener from '@/Components/DeviceDisconnectedListener';
import TrustedHostsSyncListener from '@/Components/TrustedHostsSyncListener';
import AvatarSyncListener from '@/Components/AvatarSyncListener';
import PasswordResetListener from '@/Components/PasswordResetListener';
import useRouteOverlay, { RouteOverlayActionsContext } from '@/hooks/useRouteOverlay';
import SettingsPanel from '@/Components/SettingsPanel';
import AccountPanel from '@/Components/AccountPanel';
import FeedbackPanel from '@/Components/FeedbackPanel';

// Route overlay panels reached from the account menu / Settings sidebar.
// Keyed the same way useRouteOverlay's `open(key, url)` is called below.
// Trash used to be its own overlay/panel here (see git history) - it now
// lives as a section inside SettingsPanel, opened via openSettings('trash').
const OVERLAY_PANELS = {
    settings: SettingsPanel,
    account: AccountPanel,
    feedback: FeedbackPanel,
};

export default function AuthenticatedLayout({ header, headerMaxWidth = 'max-w-8xl', children }) {
    const { auth } = usePage().props;
    // `auth` is shared on every request (see HandleInertiaRequests::share()),
    // so this layout normally assumes auth.user is always present (see the
    // note on Error.jsx). The one window that isn't true is the split second
    // between an Inertia navigation/reload starting and the new page's props
    // actually landing - React can still be asked to render this tree with
    // whatever `usePage()` currently holds. Bailing out to nothing for that
    // one frame is far better than a hard white-screen crash; the real
    // render follows immediately once the props arrive.
    if (!auth?.user) {
        return null;
    }
    const user = auth.user;
    // Superadmins carry every admin permission plus a few of their own (see
    // User::isAdmin() on the backend), so anywhere "is this user an admin"
    // gates something in the UI, superadmin must count too - otherwise a
    // superadmin loses access to admin-only nav/UI just because their role
    // string is 'superadmin' rather than literally 'admin'.
    const isAdminRole = user.role === 'admin' || user.role === 'superadmin';
    const { adminAlerts, testing } = usePage().props;
    const { version } = usePage();
    const [hasPendingAlert, setHasPendingAlert] = useState(adminAlerts?.hasPending ?? false);
    const [pendingTestCount, setPendingTestCount] = useState(testing?.pendingCount ?? 0);
    const [theme, setThemeState] = useState(getStoredTheme());
    // Hides the page header on scroll-down and brings it back on scroll-up,
    // mirroring the common "auto-hide" toolbar pattern. Stays visible near
    // the very top so it doesn't flicker away on tiny scroll jitter there.
    const [headerVisible, setHeaderVisible] = useState(true);
    useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY <= 64) {
                setHeaderVisible(true);
            } else if (currentScrollY > lastScrollY) {
                setHeaderVisible(false);
            } else if (currentScrollY < lastScrollY) {
                setHeaderVisible(true);
            }
            lastScrollY = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const { overlay, open: openOverlay, close: closeOverlay } = useRouteOverlay();
    // An optional `section` opens Settings directly on that tab instead of
    // always landing on Appearance - used by the account menu's "Trash"
    // shortcut below now that Trash lives inside Settings rather than as
    // its own overlay.
    const openSettings = (section) => openOverlay('settings', route('settings.edit'), version, {
        extraProps: section ? { initialSection: section } : undefined,
    });
    const openAccount = () => openOverlay('account', route('account.edit'), version);
    const openTrash = () => openSettings('trash');
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
    // renders for a logged-in user - unlike admin-alerts below, no fallback needed.
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

    // Was shown behind a separate hamburger button, then moved inside the
    // account dropdown; now rendered as an icon-only tab bar fixed to the
    // bottom of the screen (BottomNavBar) so it's reachable with a thumb
    // without opening the avatar menu first. `key` selects the icon there.
    const mobileNavLinks = [
        { href: route('dashboard'), label: 'Dashboard', active: route().current('dashboard'), key: 'dashboard' },
        { href: route('projects.index'), label: 'Projects', active: route().current('projects.*'), key: 'projects' },
        { href: route('tasks.index'), label: 'Tasks', active: route().current('tasks.index'), key: 'tasks' },
        ...(testing ? [{ href: route('testing.index'), label: 'Testing', active: route().current('testing.index'), badge: pendingTestCount > 0 ? pendingTestCount : undefined, key: 'testing' }] : []),
        ...(isAdminRole ? [{ href: route('admin.dashboard'), label: 'Admin', active: route().current('admin.*'), badge: hasPendingAlert ? 'dot' : undefined, key: 'admin' }] : []),
    ];

    return (
        <RouteOverlayActionsContext.Provider value={{ openSettings, openAccount, openTrash, switchToSettings, switchToAccount, switchToFeedback }}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/50 backdrop-blur dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mx-auto w-full px-3 sm:px-6 lg:px-10">
                    <div className="flex h-14 justify-between sm:h-16">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="flex items-center gap-2">
                                    <ApplicationLogo className="block h-7 w-auto fill-current text-gray-800 dark:text-gray-200 sm:h-9" />
                                    <span className="text-lg font-semibold tracking-tight text-gray-800 dark:text-gray-200 sm:text-xl">
                                        synkro
                                    </span>
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

                        <div className="flex items-center gap-1 sm:gap-2">
                            <NotificationBell />

                            <div className="hidden sm:flex sm:items-center">
                                <div className="relative ms-1">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="relative inline-flex items-center justify-center rounded-full text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out focus:outline-none dark:text-gray-400"
                                                >
                                                    <Avatar user={user} size="h-8 w-8" rounded="rounded-full" />
                                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-900">
                                                        <svg className="h-2.5 w-2.5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    </span>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content width="72" contentClasses="overflow-hidden bg-white dark:bg-gray-800">
                                            <AccountMenu user={user} theme={theme} onThemeChange={handleThemeChange} onOpenSettings={openSettings} onOpenAccount={openAccount} onOpenTrash={openTrash} />
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                            <div className="relative -me-1.5 flex items-center sm:hidden">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button type="button" className="flex items-center rounded-full p-1.5">
                                            <Avatar user={user} size="h-7 w-7" />
                                        </button>
                                    </Dropdown.Trigger>

                                    {/* align="right" anchors the panel's right edge to the trigger's
                                        right edge (end-0); the negative margin on the wrapper above
                                        pulls the trigger itself flush with the screen edge, so the
                                        panel opens right at the edge instead of leaving a gap where
                                        the hamburger used to sit. Nav links (Dashboard/Projects/etc.)
                                        no longer render in here - they moved to BottomNavBar below. */}
                                    <Dropdown.Content align="right" width="72" contentClasses="overflow-hidden bg-white dark:bg-gray-800">
                                        <AccountMenu user={user} theme={theme} onThemeChange={handleThemeChange} onOpenSettings={openSettings} onOpenAccount={openAccount} onOpenTrash={openTrash} />
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <SuspensionListener />
            <AccountDeletedListener />
            <AccountDeactivatedListener />
            <DeviceDisconnectedListener />
            <TrustedHostsSyncListener />
            <AvatarSyncListener />
            <PasswordResetListener />
            <ToastLayer />
            {header && (
                <header className={`sticky top-14 z-40 border-b border-white/10 bg-white/20 shadow-lg backdrop-blur-md transition-transform duration-300 dark:border-gray-700/20 dark:bg-gray-800/20 sm:top-16 ${headerVisible ? 'translate-y-0' : '-translate-y-[calc(100%_+_3.5rem)] sm:-translate-y-[calc(100%_+_4rem)]'}`}>
                    <div className={`mx-auto ${headerMaxWidth} px-3 py-2 sm:px-6 sm:py-3.5 lg:px-8`}>{header}</div>
                </header>
            )}

            {/* pb-20 keeps content clear of the fixed BottomNavBar on mobile (46px
                icon+label bar + safe-area inset + breathing room); sm:pb-0 drops
                it once that bar is hidden. */}
            <main className="pb-20 sm:pb-0">{children}</main>

            {OverlayPanel && <OverlayPanel {...overlay.props} onClose={closeOverlay} />}
            <BottomNavBar links={mobileNavLinks} />
        </div>
        </RouteOverlayActionsContext.Provider>
    );

}