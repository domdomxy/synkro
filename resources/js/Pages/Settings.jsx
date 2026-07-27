import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { loadTrustedHosts, saveTrustedHosts, subscribeTrustedHosts } from '@/utils/trustedHosts';
import { useEffect, useState } from 'react';

function LinkIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m4.828 1.5a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
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
    mentions: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
        </svg>
    ),
    replies: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6m-6 6h12a6 6 0 010 12h-3" />
        </svg>
    ),
    assignments: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    reviews: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l5.5 5.5M10 17a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
    ),
    membership: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-4-4" />
        </svg>
    ),
    admin: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    administration: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
};

const notificationTitles = {
    assignments: 'Task Assignments',
    reviews: 'Reviews',
    membership: 'Project Membership',
    mentions: 'Mentions',
    replies: 'Replies',
    reminders: 'Reminders',
    administration: 'Administration',
};

// Section nav (left sidebar), same pattern as Account/Edit.jsx's section nav.
const settingsNavItems = [
    {
        id: 'appearance',
        label: 'Appearance',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
        ),
    },
    {
        id: 'in-app-notifications',
        label: 'In-App Notifications',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        id: 'email-notifications',
        label: 'Email Notifications',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'trusted-sites',
        label: 'Trusted Sites',
        icon: <LinkIcon className="h-5 w-5" />,
    },
];

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

function CategoryCard({ groupKey, title, items, preferences, onToggle, onToggleAll }) {
    const keys = Object.keys(items);
    const enabledCount = keys.filter((key) => preferences[key]).length;
    const allOn = enabledCount === keys.length;

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        {categoryIcons[groupKey]}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{enabledCount} of {keys.length} enabled</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggleAll(keys, !allOn)}
                    className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:underline dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                >
                    {allOn ? 'Turn all off' : 'Turn all on'}
                </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {Object.entries(items).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                        <Toggle enabled={!!preferences[key]} onClick={() => onToggle(key, !preferences[key])} />
                    </label>
                ))}
            </div>
        </div>
    );
}
export default function Settings({ emailCatalog, emailPreferences, emailDefaults, notificationCatalog, notificationPreferences, notificationDefaults }) {
    const emailForm = useForm({ preferences: emailPreferences });
    const notificationForm = useForm({ preferences: notificationPreferences });
    const [theme, setThemeState] = useState(getStoredTheme());
    const [trustedHosts, setTrustedHosts] = useState(loadTrustedHosts);
    const [activeSection, setActiveSection] = useState(settingsNavItems[0].id);

    // Highlights whichever section is currently in view in the nav (both the sticky desktop
    // sidebar and the horizontal mobile pill bar), so it's clear where you are on a page this
    // long instead of the nav just being a set of static jump links. Picks the entry closest to
    // the top of the viewport among those currently intersecting, which reads better than a
    // single fixed rootMargin band when sections vary a lot in height (Email Notifications is
    // much taller than Appearance).
    useEffect(() => {
        const sections = settingsNavItems
            .map((s) => document.getElementById(s.id))
            .filter(Boolean);
        if (sections.length === 0) return;

        const visible = new Map();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        visible.set(entry.target.id, entry.boundingClientRect.top);
                    } else {
                        visible.delete(entry.target.id);
                    }
                });
                if (visible.size > 0) {
                    const topMost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
                    setActiveSection(topMost);
                }
            },
            { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
        );
        sections.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleThemeChange = (value) => {
        setStoredTheme(value);
        setThemeState(value);
    };

    // Trusted sites are stored client-side (browser localStorage), same as
    // theme above - there's no server record to load, and revoking here takes
    // effect immediately for the ExternalLinkGuard already mounted in this tab.
    useEffect(() => subscribeTrustedHosts(setTrustedHosts), []);
    const revokeTrustedHost = (host) => {
        const next = trustedHosts.filter((h) => h !== host);
        setTrustedHosts(next);
        saveTrustedHosts(next);
    };
    const revokeAllTrustedHosts = () => {
        setTrustedHosts([]);
        saveTrustedHosts([]);
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
    const submitEmail = (e) => {
        e.preventDefault();
        emailForm.patch(route('settings.email'));
    };
    const resetEmailToDefaults = () => {
        emailForm.setData('preferences', { ...emailDefaults });
    };
    const emailCatalogKeys = Object.values(emailCatalog).flatMap((group) => Object.keys(group.items));
    const emailTotalKeys = emailCatalogKeys.length;
    const emailTotalEnabled = emailCatalogKeys.filter((key) => emailForm.data.preferences[key]).length;
    const emailHasChanges = JSON.stringify(emailForm.data.preferences) !== JSON.stringify(emailPreferences);
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
    const submitNotifications = (e) => {
        e.preventDefault();
        notificationForm.patch(route('settings.notifications'));
    };
    const resetNotificationsToDefaults = () => {
        notificationForm.setData('preferences', { ...notificationDefaults });
    };
    const notificationKeys = Object.keys(notificationCatalog);
    const notificationTotalEnabled = notificationKeys.filter((key) => notificationForm.data.preferences[key]).length;
    const notificationAllOn = notificationTotalEnabled === notificationKeys.length;
    const notificationHasChanges = JSON.stringify(notificationForm.data.preferences) !== JSON.stringify(notificationPreferences);
    const notificationAtDefaults = JSON.stringify(notificationForm.data.preferences) === JSON.stringify(notificationDefaults);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Settings</h2>}>
            <Head title="Settings" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <p className="mb-6 px-4 text-sm text-gray-500 dark:text-gray-400 sm:px-0">
                        Manage your appearance, notifications, and trusted sites.
                    </p>

                    {/* Mobile section nav - the sticky sidebar below is desktop-only (lg:), so this
                        horizontal pill bar is the only way to jump between sections on small screens. */}
                    <nav className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:hidden">
                        <div className="flex w-max gap-2">
                            {settingsNavItems.map((s) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                                        activeSection === s.id
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </nav>

                    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

                        {/* Section nav */}
                        <nav className="hidden lg:block">
                            <div className="sticky top-24 space-y-1">
                                {settingsNavItems.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className={`flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition ${
                                            activeSection === s.id
                                                ? 'border-indigo-600 bg-indigo-50 font-medium text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                : 'border-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                        {s.label}
                                    </a>
                                ))}
                            </div>
                        </nav>

                        {/* Sections */}
                        <div className="space-y-6">

                    {/* Appearance */}
                    <div id="appearance" className="scroll-mt-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Choose how Synkro looks on this device</p>
                            </div>
                        </div>
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

                    {/* Trusted Sites */}
                    <div id="trusted-sites" className="scroll-mt-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <LinkIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Trusted Sites</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Sites you've told Synkro to trust skip the "Leaving Synkro" confirmation on external links.
                                    </p>
                                </div>
                            </div>
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
                            <p className="rounded-md border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                                No trusted sites yet. Tick "Trust ... links from now on" the next time you click an external link to add one here.
                            </p>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {trustedHosts.map((host) => (
                                    <div key={host} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                                        <span className="flex items-center gap-2 truncate text-sm text-gray-600 dark:text-gray-400">
                                            <LinkIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                                            {host}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => revokeTrustedHost(host)}
                                            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* In-App Notifications */}
                    <form id="in-app-notifications" onSubmit={submitNotifications} className="scroll-mt-24 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">In-App Notifications</h3>
                                <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
                                    {notificationTotalEnabled} of {notificationKeys.length} categories enabled (controls what shows up in your notification bell)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleNotificationMany(notificationKeys, !notificationAllOn)}
                                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:underline dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                            >
                                {notificationAllOn ? 'Turn all off' : 'Turn all on'}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(notificationCatalog).map(([key, description]) => (
                                <div key={key} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                                    <label className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                {categoryIcons[key]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notificationTitles[key] ?? key}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
                                            </div>
                                        </div>
                                        <Toggle
                                            enabled={!!notificationForm.data.preferences[key]}
                                            onClick={() => toggleNotification(key, !notificationForm.data.preferences[key])}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {notificationHasChanges ? 'You have unsaved changes' : notificationForm.recentlySuccessful ? 'All changes saved' : 'No changes yet'}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetNotificationsToDefaults}
                                    disabled={notificationAtDefaults}
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Reset to defaults
                                </button>
                                <button
                                    type="submit"
                                    disabled={notificationForm.processing || !notificationHasChanges}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Email Notifications */}
                    <form id="email-notifications" onSubmit={submitEmail} className="scroll-mt-24 space-y-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Email Notifications</h3>
                                    <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
                                        {emailTotalEnabled} of {emailTotalKeys} email types enabled
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Not seeing our emails? Check your spam or junk folder; marking one as "Not spam" usually fixes it for future emails too.
                                </p>
                            </div>
                        </div>

                        {Object.entries(emailCatalog).map(([groupKey, group]) => (
                            <CategoryCard
                                key={groupKey}
                                groupKey={groupKey}
                                title={group.label}
                                items={group.items}
                                preferences={emailForm.data.preferences}
                                onToggle={toggleEmail}
                                onToggleAll={toggleEmailMany}
                            />
                        ))}

                        <div className="sticky bottom-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {emailHasChanges ? 'You have unsaved changes' : emailForm.recentlySuccessful ? 'All changes saved' : 'No changes yet'}
                            </span>
                            <div className="flex items-center gap-3">
                                {emailForm.recentlySuccessful && !emailHasChanges && (
                                    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                <button
                                    type="button"
                                    onClick={resetEmailToDefaults}
                                    disabled={emailAtDefaults}
                                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Reset to defaults
                                </button>
                                <button
                                    type="submit"
                                    disabled={emailForm.processing || !emailHasChanges}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}