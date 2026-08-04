import Modal from '@/Components/Modal';
import SectionSelect from '@/Components/SectionSelect';
import NavSearchInput from '@/Components/NavSearchInput';
import TrashSection from '@/Components/TrashSection';
import { Link, router, useForm } from '@inertiajs/react';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { silentSubmit } from '@/utils/silentSubmit';
import {
    primeTrustedHosts,
    subscribeTrustedHosts,
    revokeTrustedHost as revokeTrustedHostRequest,
    revokeAllTrustedHosts as revokeAllTrustedHostsRequest,
} from '@/utils/trustedHosts';
import { useEffect, useMemo, useRef, useState } from 'react';
import useConfirm from '@/hooks/useConfirm';
import { useRouteOverlayActions } from '@/hooks/useRouteOverlay';

function LinkIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m4.828 1.5a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
        </svg>
    );
}

// Same glyph as Trash.jsx's own TrashIcon - kept as a local copy rather than
// a shared import since Trash.jsx is a page module, not a component one.
function TrashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

const categoryIcons = {
    account: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    project: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    task: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    tickets: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    reminders: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    admin: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
};

// Section nav (left sidebar), same pattern as Account/Edit.jsx's section nav.
// `terms` feeds NavSearchInput - the actual field/control names living
// inside each section, so searching "dark" surfaces Appearance even though
// the section itself is titled "Appearance", not "Dark".
const settingsNavItems = [
    {
        id: 'appearance',
        label: 'Appearance',
        terms: ['Appearance', 'Theme', 'System', 'Light', 'Dark', 'Black'],
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
        ),
    },
    {
        id: 'trusted-sites',
        label: 'Trusted Sites',
        terms: ['Trusted Sites', 'Revoke all', 'External links'],
        icon: <LinkIcon className="h-5 w-5" />,
    },
    {
        id: 'notifications',
        label: 'Notifications',
        terms: ['Notifications', 'Email', 'In App'],
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        id: 'trash',
        label: 'Trash',
        terms: ['Trash', 'Deleted items', 'Recently deleted', 'Restore', 'Recycle bin', 'Purge'],
        icon: <TrashIcon className="h-5 w-5" />,
    },
    {
        id: 'support',
        label: 'Support',
        terms: ['Support', 'Submit Feedback', 'Track a ticket', 'Report a bug'],
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

// Lightweight mirror of AccountPanel's section list (id/label/terms only),
// used solely so this panel's NavSearchInput can also surface Account
// sections and jump there via switchToAccount. Kept as plain duplicated
// metadata rather than importing it from AccountPanel.jsx, which would
// create a circular module dependency between the two panels (each would
// need the other's items at load time). Every entry is tagged `panel:
// 'account'` so handleNavSelect below knows to switch panels instead of
// just changing the active section.
const accountSectionsForSearch = [
    { id: 'avatar', label: 'Avatar', terms: ['Avatar', 'Profile picture', 'Upload photo'] },
    { id: 'account-information', label: 'Account Information', terms: ['Account Information', 'Name', 'Email'] },
    { id: 'update-password', label: 'Password', terms: ['Password', 'Current Password', 'New Password', 'Confirm Password'] },
    { id: 'deactivate-account', label: 'Deactivate Account', terms: ['Deactivate Account', 'Freeze submissions', 'Log out'] },
    { id: 'delete-account', label: 'Delete Account', terms: ['Delete Account', 'Permanently delete', 'Grace period'] },
].map((s) => ({ ...s, panel: 'account', icon: categoryIcons.account }));

// Appearance picker options. `swatch` gives each card a small preview of that theme's background
// so the choice is recognizable at a glance instead of relying on the label alone; `icon` is drawn
// in that background's contrasting color (set via the swatch class) rather than currentColor from
// the button, since it needs to stay legible against its own preview regardless of selection state.
const THEME_OPTIONS = [
    {
        id: 'system',
        label: 'System',
        swatch: 'bg-gray-400',
        icon: (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'light',
        label: 'Light',
        swatch: 'bg-white',
        icon: (
            <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.219 4.219l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.219 19.781l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
        ),
    },
    {
        id: 'dark',
        label: 'Dark',
        swatch: 'bg-gray-700',
        icon: (
            <svg className="h-5 w-5 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
        ),
    },
    {
        id: 'black',
        label: 'Black',
        swatch: 'bg-black',
        icon: (
            <svg className="h-5 w-5 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18a9 9 0 000 18 9 9 0 000-18z" />
            </svg>
        ),
    },
];

// Title + description shown in the modal's header bar for whichever section is active.
const SECTION_META = {
    appearance: { title: 'Appearance', description: 'Choose how Synkro looks on this device' },
    'trusted-sites': { title: 'Trusted Sites', description: 'Manage links you\'ve told Synkro to trust' },
    notifications: { title: 'Notifications', description: 'Choose how you hear about activity, by email and in-app' },
    trash: { title: 'Trash', description: 'Review deleted projects and tasks before they\'re gone for good' },
    support: { title: 'Support', description: 'Get help, report a bug, or send us feedback' },
};

function CloseIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function Toggle({ enabled, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
        >
            <span
                className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            >
                {enabled ? (
                    <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </span>
        </button>
    );
}

function TrustedSiteRow({ host, onRevoke }) {
    const [faviconFailed, setFaviconFailed] = useState(false);

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-2.5 transition hover:border-gray-200 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:border-gray-600 dark:hover:bg-gray-700/30">
            <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                    {faviconFailed ? (
                        <LinkIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    ) : (
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                            alt=""
                            className="h-4 w-4"
                            onError={() => setFaviconFailed(true)}
                        />
                    )}
                </span>
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">{host}</span>
            </span>
            <button
                type="button"
                onClick={onRevoke}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
                Revoke
            </button>
        </div>
    );
}

function NotificationCategoryCard({ groupKey, title, items, emailPreferences, emailDefaults, notificationCatalog, notificationPreferences, onToggleEmail, onToggleEmailMany, onToggleNotification, onToggleNotificationMany }) {
    const keys = Object.keys(items);
    // Most rows have both an email and an in-app toggle, but a few events
    // (e.g. checklist item edited/removed) are in-app only - they show up
    // here (folded in from notificationCatalog by the caller) with no
    // EmailPreferences entry at all, so they're excluded from the email
    // column/count entirely rather than defaulting to an always-off toggle.
    const emailKeys = keys.filter((key) => emailDefaults[key] !== undefined);
    const notifKeys = keys.filter((key) => notificationCatalog[key] !== undefined);

    let totalChannels = 0;
    let enabledChannels = 0;
    emailKeys.forEach((key) => {
        totalChannels += 1;
        if (emailPreferences[key]) enabledChannels += 1;
    });
    notifKeys.forEach((key) => {
        totalChannels += 1;
        if (notificationPreferences[key]) enabledChannels += 1;
    });
    const allOn = totalChannels > 0 && enabledChannels === totalChannels;

    const toggleAll = () => {
        const next = !allOn;
        if (emailKeys.length > 0) onToggleEmailMany(emailKeys, next);
        if (notifKeys.length > 0) onToggleNotificationMany(notifKeys, next);
    };

    return (
        <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        {categoryIcons[groupKey]}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{enabledChannels} of {totalChannels} enabled</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={toggleAll}
                    className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:underline dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                >
                    {allOn ? 'Turn all off' : 'Turn all on'}
                </button>
            </div>
            <div className="grid grid-cols-[1fr_56px_56px] items-center gap-2 pb-2 sm:grid-cols-[1fr_72px_72px] sm:gap-3">
                <span></span>
                <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Email</span>
                <span className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">In App</span>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600/50">
                {Object.entries(items).map(([key, label]) => {
                    const hasEmail = emailDefaults[key] !== undefined;
                    const hasNotification = notificationCatalog[key] !== undefined;
                    return (
                        <div key={key} className="grid grid-cols-[1fr_56px_56px] items-center gap-2 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_72px_72px] sm:gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                            <div className="flex justify-center">
                                {hasEmail ? (
                                    <Toggle enabled={!!emailPreferences[key]} onClick={() => onToggleEmail(key, !emailPreferences[key])} />
                                ) : (
                                    <span className="text-sm text-gray-300 dark:text-gray-600" title="This event doesn't send an email, only an in-app notification">—</span>
                                )}
                            </div>
                            <div className="flex justify-center">
                                {hasNotification ? (
                                    <Toggle
                                        enabled={!!notificationPreferences[key]}
                                        onClick={() => onToggleNotification(key, !notificationPreferences[key])}
                                    />
                                ) : (
                                    <span className="text-sm text-gray-300 dark:text-gray-600" title="No in-app equivalent for this event">—</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
export default function SettingsPanel({ emailCatalog, emailPreferences, emailDefaults, notificationCatalog, notificationPreferences, notificationDefaults, trustedLinkHosts, trashedProjects, trashedTasks, deletableProjects, deletableTasks, initialSection, onClose }) {
    const overlayActions = useRouteOverlayActions();
    const emailForm = useForm({ preferences: emailPreferences });
    const notificationForm = useForm({ preferences: notificationPreferences });
    // Baseline to diff against for "has unsaved changes" - updated locally on
    // a successful save instead of via the (unchanged, since we no longer
    // navigate) emailPreferences/notificationPreferences props.
    const [savedEmailPreferences, setSavedEmailPreferences] = useState(emailPreferences);
    const [savedNotificationPreferences, setSavedNotificationPreferences] = useState(notificationPreferences);
    const [notificationSettingsProcessing, setNotificationSettingsProcessing] = useState(false);
    const [notificationSettingsRecentlySuccessful, setNotificationSettingsRecentlySuccessful] = useState(false);
    const notificationSuccessTimeout = useRef(null);
    const { confirm, ConfirmDialog } = useConfirm();
    const [theme, setThemeState] = useState(getStoredTheme());
    const [trustedHosts, setTrustedHosts] = useState(trustedLinkHosts ?? []);
    const [activeSection, setActiveSection] = useState(() => {
        if (initialSection && settingsNavItems.some((s) => s.id === initialSection)) return initialSection;
        const requested = new URLSearchParams(window.location.search).get('section');
        return settingsNavItems.some((s) => s.id === requested) ? requested : settingsNavItems[0].id;
    });
    const [notificationSearchQuery, setNotificationSearchQuery] = useState('');
    const trashItemCount = (trashedProjects?.length ?? 0) + (trashedTasks?.length ?? 0);
    // Feeds NavSearchInput - same section list, but with the notifications
    // entry's terms extended by the actual category labels from the catalog
    // (e.g. "Task assigned", "Project deleted") so those are searchable too,
    // not just the word "Notifications" itself. Each item is tagged `panel:
    // 'settings'` and combined with the Account sections above so searching
    // from here can also jump straight into the Account panel.
    const searchableNavItems = [
        ...settingsNavItems.map((s) =>
            s.id === 'notifications'
                ? { ...s, panel: 'settings', terms: [...s.terms, ...Object.values(emailCatalog).map((g) => g.label), ...Object.values(notificationCatalog)] }
                : { ...s, panel: 'settings' }
        ),
        ...accountSectionsForSearch,
    ];
    // Handles a NavSearchInput pick that may belong to either this panel or
    // Account's - same-panel results just switch the active section, cross-
    // panel ones hand off to switchToAccount so the whole panel swaps and
    // opens directly on that section. Falls back to a real navigation if
    // this instance somehow isn't rendered under AuthenticatedLayout.
    const handleNavSelect = (item) => {
        if (item.panel === 'account') {
            if (overlayActions?.switchToAccount) {
                overlayActions.switchToAccount(item.id);
            } else {
                router.visit(route('account.edit', { section: item.id }));
            }
        } else {
            setActiveSection(item.id);
        }
    };

    // activeSection now drives which single settings panel is shown (tab switching),
    // not a scroll position — set directly by clicking a sidebar/pill item below.

    const handleThemeChange = (value) => {
        setStoredTheme(value);
        setThemeState(value);
    };

    // Trusted sites are stored on the account (server-side), not the browser,
    // so they follow the person to every device/browser they sign into. This
    // page already gets the current list as a prop from SettingsController,
    // so seed the shared cache with it instead of re-fetching, then stay in
    // sync with any change (e.g. a new host trusted via ExternalLinkGuard,
    // which is mounted separately and outside Inertia's page swapping).
    useEffect(() => primeTrustedHosts(trustedLinkHosts ?? []), []);
    useEffect(() => subscribeTrustedHosts(setTrustedHosts), []);
    const revokeTrustedHost = async (host) => {
        if (!(await confirm(`Links from ${host} will show the "Leaving Synkro" confirmation again.`, { title: `Revoke trust for ${host}?`, danger: true, confirmLabel: 'Revoke' }))) return;
        try {
            await revokeTrustedHostRequest(host);
        } catch {
            // request failed - leave the list as-is rather than pretending it revoked
        }
    };
    const revokeAllTrustedHosts = async () => {
        if (!(await confirm('Every trusted site will show the "Leaving Synkro" confirmation again.', { title: 'Revoke all trusted sites?', danger: true, confirmLabel: 'Revoke All' }))) return;
        try {
            await revokeAllTrustedHostsRequest();
        } catch {
            // request failed - leave the list as-is rather than pretending it revoked
        }
    };

    // --- Email preferences ---
    const toggleEmail = (key, value) => {
        emailForm.setData('preferences', { ...emailForm.data.preferences, [key]: value });
    };
    const toggleEmailMany = (keys, value) => {
        const updated = { ...emailForm.data.preferences };
        keys.forEach((key) => { updated[key] = value; });
        emailForm.setData('preferences', updated);
    };
    const resetEmailToDefaults = () => {
        emailForm.setData('preferences', { ...emailDefaults });
    };
    const emailHasChanges = JSON.stringify(emailForm.data.preferences) !== JSON.stringify(savedEmailPreferences);
    const emailAtDefaults = JSON.stringify(emailForm.data.preferences) === JSON.stringify(emailDefaults);

    // --- Notification preferences (in-app bell) ---
    const toggleNotification = (key, value) => {
        notificationForm.setData('preferences', { ...notificationForm.data.preferences, [key]: value });
    };
    const toggleNotificationMany = (keys, value) => {
        const updated = { ...notificationForm.data.preferences };
        keys.forEach((key) => { updated[key] = value; });
        notificationForm.setData('preferences', updated);
    };
    const resetNotificationsToDefaults = () => {
        notificationForm.setData('preferences', { ...notificationDefaults });
    };
    const notificationHasChanges = JSON.stringify(notificationForm.data.preferences) !== JSON.stringify(savedNotificationPreferences);
    const notificationAtDefaults = JSON.stringify(notificationForm.data.preferences) === JSON.stringify(notificationDefaults);

    // --- Combined (unified Notifications section covers both underlying forms) ---
    const submitNotificationSettings = async (e) => {
        e.preventDefault();
        setNotificationSettingsProcessing(true);
        let allOk = true;

        if (emailHasChanges) {
            const result = await silentSubmit(route('settings.email'), { method: 'PATCH', data: emailForm.data });
            if (result.ok) {
                setSavedEmailPreferences(emailForm.data.preferences);
            } else {
                allOk = false;
            }
        }
        if (notificationHasChanges) {
            const result = await silentSubmit(route('settings.notifications'), { method: 'PATCH', data: notificationForm.data });
            if (result.ok) {
                setSavedNotificationPreferences(notificationForm.data.preferences);
            } else {
                allOk = false;
            }
        }

        setNotificationSettingsProcessing(false);
        if (allOk) {
            setNotificationSettingsRecentlySuccessful(true);
            clearTimeout(notificationSuccessTimeout.current);
            notificationSuccessTimeout.current = setTimeout(() => setNotificationSettingsRecentlySuccessful(false), 2000);
        }
    };
    const resetNotificationSettingsToDefaults = () => {
        resetEmailToDefaults();
        resetNotificationsToDefaults();
    };
    const notificationSettingsHasChanges = emailHasChanges || notificationHasChanges;
    const notificationSettingsAtDefaults = emailAtDefaults && notificationAtDefaults;

    // Some events (checklist item edited/removed) only ever produce an
    // in-app notification, with no EmailPreferences entry at all - so they
    // don't exist anywhere in emailCatalog. Fold any such notificationCatalog
    // entries into the matching group here (matched by the "task."/"project."
    // prefix shared by both catalogs) so they get a row - with a dash under
    // Email and a real toggle under In App, handled by NotificationCategoryCard
    // - instead of silently having no UI control at all.
    const mergedNotificationCatalog = useMemo(() => {
        const result = {};
        Object.entries(emailCatalog).forEach(([groupKey, group]) => {
            const items = { ...group.items };
            Object.entries(notificationCatalog).forEach(([key, label]) => {
                if (key.startsWith(`${groupKey}.`) && items[key] === undefined) {
                    items[key] = label;
                }
            });
            result[groupKey] = { ...group, items };
        });
        return result;
    }, [emailCatalog, notificationCatalog]);

    // Powers the search box at the top of the Notifications section itself
    // (separate from NavSearchInput, which only jumps between sections). A
    // group stays whole if its own label matches; otherwise only its
    // matching events are kept, so searching "task" surfaces just the
    // task-related rows inside every relevant category instead of hiding
    // groups wholesale.
    const filteredEmailCatalog = useMemo(() => {
        const q = notificationSearchQuery.trim().toLowerCase();
        if (!q) return mergedNotificationCatalog;
        const result = {};
        Object.entries(mergedNotificationCatalog).forEach(([groupKey, group]) => {
            const groupMatches = group.label.toLowerCase().includes(q);
            const items = groupMatches
                ? group.items
                : Object.fromEntries(Object.entries(group.items).filter(([, label]) => label.toLowerCase().includes(q)));
            if (Object.keys(items).length > 0) {
                result[groupKey] = { ...group, items };
            }
        });
        return result;
    }, [emailCatalog, notificationSearchQuery]);

    return (
        <>
            {/* Settings opens as a modal (like every other dialog in the app),
                not a page you scroll through. */}
            <Modal show onClose={onClose} maxWidth="6xl" overlayClassName="bg-black/55 dark:bg-black/70" panelClassName="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                {/* Rendered inside the outer Modal (not as a sibling) so Headless UI sees the
                    true parent/child nesting - it only tracks dialog stacking depth correctly
                    when dialogs are nested in the React tree, otherwise confirming or dismissing
                    this one can also close the settings panel behind it. */}
                {ConfirmDialog}

                <div className="flex h-[88vh] max-h-[860px] w-full flex-col">

                    {/* Mobile section nav - the fixed sidebar below is desktop-only (sm:), so this
                        dropdown is the only way to switch sections on small screens. A <select>
                        keeps every label fully readable instead of a horizontal pill bar that
                        can clip the first item. */}
                    <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-600 sm:hidden">
                        <NavSearchInput items={searchableNavItems} onSelect={handleNavSelect} />
                        <SectionSelect items={settingsNavItems} value={activeSection} onChange={setActiveSection} />
                    </div>

                    <div className="flex min-h-0 flex-1">

                        {/* Section nav */}
                        <nav className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50/60 p-3 dark:border-gray-600 dark:bg-black/20 sm:flex">
                            <NavSearchInput items={searchableNavItems} onSelect={handleNavSelect} />
                            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                Settings
                            </p>
                            <div className="space-y-0.5">
                                {settingsNavItems.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setActiveSection(s.id)}
                                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition ${
                                            activeSection === s.id
                                                ? 'bg-white font-medium text-indigo-700 shadow-sm dark:bg-gray-800 dark:text-indigo-300'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60'
                                        }`}
                                    >
                                        <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                        <span className="flex-1">{s.label}</span>
                                        {/* Quick-glance count so a full trash doesn't require opening the
                                            section to notice - mirrors the notification bell's own badge
                                            pattern instead of inventing a new one. */}
                                        {s.id === 'trash' && trashItemCount > 0 && (
                                            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-gray-300 px-1 text-[10px] font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                                                {trashItemCount > 99 ? '99+' : trashItemCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto space-y-0.5 border-t border-gray-300 pt-2 dark:border-gray-600">
                                {overlayActions?.switchToAccount ? (
                                    <button
                                        type="button"
                                        onClick={() => overlayActions.switchToAccount()}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60"
                                    >
                                        <span className="h-4 w-4 shrink-0">{categoryIcons.account}</span>
                                        Account
                                    </button>
                                ) : (
                                    <Link
                                        href={route('account.edit')}
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60"
                                    >
                                        <span className="h-4 w-4 shrink-0">{categoryIcons.account}</span>
                                        Account
                                    </Link>
                                )}
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    <LogOutIcon className="h-4 w-4 shrink-0" />
                                    Log Out
                                </Link>
                            </div>
                        </nav>

                        {/* Active section */}
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-6 py-3.5 dark:border-gray-600">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {SECTION_META[activeSection]?.title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                    <span className="sr-only">Close settings</span>
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-6">

                    {activeSection === 'appearance' && (
                    <div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {THEME_OPTIONS.map(({ id, label, icon, swatch }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleThemeChange(id)}
                                    aria-pressed={theme === id}
                                    className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition ${
                                        theme === id
                                            ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/30'
                                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {theme === id && (
                                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    )}
                                    <span className={`flex h-10 w-full items-center justify-center rounded-md border border-black/5 ${swatch}`}>
                                        {icon}
                                    </span>
                                    <span className={`text-xs font-medium ${theme === id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    )}

                    {activeSection === 'trusted-sites' && (
                    <div>
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {trustedHosts.length === 0
                                    ? 'Sites you\'ve told Synkro to trust skip the "Leaving Synkro" confirmation on external links.'
                                    : `${trustedHosts.length} site${trustedHosts.length === 1 ? '' : 's'} skip the "Leaving Synkro" confirmation.`}
                            </p>
                            {trustedHosts.length > 0 && (
                                <button
                                    type="button"
                                    onClick={revokeAllTrustedHosts}
                                    className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:underline dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    Revoke all
                                </button>
                            )}
                        </div>

                        {trustedHosts.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
                                <LinkIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm text-gray-400 dark:text-gray-500">No trusted sites yet.</p>
                                <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">
                                    Tick "Trust ... links from now on" the next time you click an external link to add one here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {trustedHosts.map((host) => (
                                    <TrustedSiteRow key={host} host={host} onRevoke={() => revokeTrustedHost(host)} />
                                ))}
                            </div>
                        )}
                    </div>
                    )}

                    {activeSection === 'notifications' && (
                    // flex + min-h-full: without this, a short catalog (few groups) leaves the form
                    // shorter than the scroll pane, so the sticky footer just sits at the end of the
                    // content instead of the pane's actual bottom edge (gap underneath, on both mobile
                    // and desktop). Making the form stretch to fill the pane pushes the footer to the
                    // true bottom via normal flex layout when content is short, while `sticky bottom-0`
                    // below still keeps it pinned there once content is tall enough to scroll.
                    <form onSubmit={submitNotificationSettings} className="flex min-h-full flex-col">
                        <div className="flex-1 space-y-6">
                        <div className="relative">
                            <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                value={notificationSearchQuery}
                                onChange={(e) => setNotificationSearchQuery(e.target.value)}
                                placeholder="Search notification settings"
                                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-7 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-500"
                            />
                            {notificationSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setNotificationSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="sr-only">Clear search</span>
                                </button>
                            )}
                        </div>

                        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Not seeing our emails? Check your spam or junk folder; marking one as "Not spam" usually fixes it for future emails too.
                                A dash under "In App" means that event only ever sends an email, with nothing to show in the bell.
                            </p>
                        </div>

                        {Object.keys(filteredEmailCatalog).length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
                                <svg className="h-6 w-6 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <p className="text-sm text-gray-400 dark:text-gray-500">No notification settings match "{notificationSearchQuery}".</p>
                            </div>
                        ) : (
                            Object.entries(filteredEmailCatalog).map(([groupKey, group]) => (
                                <NotificationCategoryCard
                                    key={groupKey}
                                    groupKey={groupKey}
                                    title={group.label}
                                    items={group.items}
                                    emailPreferences={emailForm.data.preferences}
                                    emailDefaults={emailDefaults}
                                    notificationCatalog={notificationCatalog}
                                    notificationPreferences={notificationForm.data.preferences}
                                    onToggleEmail={toggleEmail}
                                    onToggleEmailMany={toggleEmailMany}
                                    onToggleNotification={toggleNotification}
                                    onToggleNotificationMany={toggleNotificationMany}
                                />
                            ))
                        )}
                        </div>

                        <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col gap-2 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur dark:border-gray-600 dark:bg-gray-900/95 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-6 sm:py-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                                {notificationSettingsHasChanges ? 'You have unsaved changes' : notificationSettingsRecentlySuccessful ? 'All changes saved' : 'No changes yet'}
                            </span>
                            <div className="flex items-center justify-end gap-2 sm:gap-3">
                                {notificationSettingsRecentlySuccessful && (
                                    <svg className="h-4 w-4 shrink-0 text-green-500 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                <button
                                    type="button"
                                    onClick={resetNotificationSettingsToDefaults}
                                    disabled={notificationSettingsAtDefaults}
                                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700 sm:px-3 sm:py-2 sm:text-sm"
                                >
                                    Reset to defaults
                                </button>
                                <button
                                    type="submit"
                                    disabled={notificationSettingsProcessing || !notificationSettingsHasChanges}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </form>
                    )}

                    {activeSection === 'trash' && (
                        <TrashSection
                            trashedProjects={trashedProjects}
                            trashedTasks={trashedTasks}
                            deletableProjects={deletableProjects}
                            deletableTasks={deletableTasks}
                        />
                    )}

                    {activeSection === 'support' && (
                    <div className="space-y-3">
                        {overlayActions?.switchToFeedback ? (
                            <button
                                type="button"
                                onClick={() => overlayActions.switchToFeedback('submit')}
                                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 text-start transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </span>
                                <span>
                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Submit Feedback</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500">Report a bug, ask a question, or share a suggestion</span>
                                </span>
                            </button>
                        ) : (
                            <Link
                                href={route('feedback.page', { from: 'settings' })}
                                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </span>
                                <span>
                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Submit Feedback</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500">Report a bug, ask a question, or share a suggestion</span>
                                </span>
                            </Link>
                        )}
                        {overlayActions?.switchToFeedback ? (
                            <button
                                type="button"
                                onClick={() => overlayActions.switchToFeedback('track')}
                                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 text-start transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <span>
                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Track a Ticket</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500">Check the status of feedback you already submitted</span>
                                </span>
                            </button>
                        ) : (
                            <Link
                                href={route('feedback.page', { from: 'settings' })}
                                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <span>
                                    <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">Track a Ticket</span>
                                    <span className="block text-xs text-gray-400 dark:text-gray-500">Check the status of feedback you already submitted</span>
                                </span>
                            </Link>
                        )}
                    </div>
                    )}

                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}