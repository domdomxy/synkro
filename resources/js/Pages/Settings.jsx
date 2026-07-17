import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { getStoredTheme, setStoredTheme } from '@/theme';
import { useState } from 'react';

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
};

const notificationTitles = {
    assignments: 'Task Assignments',
    reviews: 'Reviews',
    membership: 'Project Membership',
    reminders: 'Reminders',
};

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
export default function Settings({ emailCatalog, emailPreferences, notificationCatalog, notificationPreferences }) {
    const emailForm = useForm({ preferences: emailPreferences });
    const notificationForm = useForm({ preferences: notificationPreferences });
    const [theme, setThemeState] = useState(getStoredTheme());

    const handleThemeChange = (value) => {
        setStoredTheme(value);
        setThemeState(value);
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
    const emailCatalogKeys = Object.values(emailCatalog).flatMap((group) => Object.keys(group.items));
    const emailTotalKeys = emailCatalogKeys.length;
    const emailTotalEnabled = emailCatalogKeys.filter((key) => emailForm.data.preferences[key]).length;
    const emailHasChanges = JSON.stringify(emailForm.data.preferences) !== JSON.stringify(emailPreferences);

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
    const notificationKeys = Object.keys(notificationCatalog);
    const notificationTotalEnabled = notificationKeys.filter((key) => notificationForm.data.preferences[key]).length;
    const notificationAllOn = notificationTotalEnabled === notificationKeys.length;
    const notificationHasChanges = JSON.stringify(notificationForm.data.preferences) !== JSON.stringify(notificationPreferences);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Settings</h2>}>
            <Head title="Settings" />
            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">

                    {/* Appearance */}
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
                        </div>
                        <div className="flex gap-2">
                            {['system', 'light', 'dark', 'black'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleThemeChange(option)}
                                    className={`flex-1 rounded-md px-3 py-2 text-sm capitalize ${
                                        theme === option
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* In-App Notifications */}
                    <form onSubmit={submitNotifications} className="space-y-4">
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
                            <button
                                type="submit"
                                disabled={notificationForm.processing || !notificationHasChanges}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </form>

                    {/* Email Notifications */}
                    <form onSubmit={submitEmail} className="space-y-6">
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
        </AuthenticatedLayout>
    );
}