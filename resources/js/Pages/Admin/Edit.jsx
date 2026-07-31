import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Avatar from '@/Components/Avatar';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateAccountInformationForm from './Partials/UpdateAccountInformationForm';
import UpdateAvatarForm from './Partials/UpdateAvatarForm';
import DeactivateAccountForm from './Partials/DeactivateAccountForm';

const sections = [
    {
        id: 'avatar',
        label: 'Avatar',
        description: 'Update your account picture.',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        id: 'account-information',
        label: 'Account Information',
        description: "Update your account's name and email address.",
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        id: 'update-password',
        label: 'Password',
        description: 'Ensure your account is using a long, random password to stay secure.',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
];

const dangerSections = [
    {
        id: 'deactivate-account',
        label: 'Deactivate Account',
        description: [
            'Deactivating your account will log you out and freeze your active task submissions.',
            'You can reactivate at any time by logging back in.',
        ],
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
    },
    {
        id: 'delete-account',
        label: 'Delete Account',
        description: [
            "We'll email you a confirmation link first. Your account isn't deleted until you click it.",
            "Even after that, it's kept for a few days before permanent erasure — plenty of time to log back in and restore it.",
        ],
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
];

function SectionCard({ id, label, description, icon, children, danger }) {
    return (
        <section
            id={id}
            className={`scroll-mt-24 rounded-lg bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800 ${
                danger ? 'border border-red-200 dark:border-red-900/50' : ''
            }`}
        >
            <div className="mb-6 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    danger
                        ? 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                }`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-base font-semibold ${danger ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {label}
                    </h3>
                    {Array.isArray(description) ? (
                        <>
                            <p className={`mt-0.5 text-sm ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {description[0]}
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                {description[1]}
                            </p>
                        </>
                    ) : (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                </div>
            </div>
            {children}
        </section>
    );
}

function ProfileHeader({ user }) {
    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:bg-gray-800">
            <div className="flex min-w-0 items-center gap-4">
                <Avatar user={user} size="h-14 w-14" rounded="rounded-xl" />
                <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                {user.role === 'admin' && (
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        Admin
                    </span>
                )}
                {user.email_verified_at ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                    </span>
                ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        Unverified
                    </span>
                )}
                {memberSince && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Member since {memberSince}</span>
                )}
            </div>
        </div>
    );
}

export default function Edit({ mustVerifyEmail, status, deletionRequestedAt, deletionGraceDays }) {
    const user = usePage().props.auth.user;
    const allNavItems = [...sections, ...dangerSections];
    const [activeSection, setActiveSection] = useState(allNavItems[0].id);

    // Highlights whichever section is currently in view in the nav, same scroll-spy pattern as
    // Settings.jsx's section nav: picks the entry closest to the top of the viewport among those
    // currently intersecting, so the highlighted item tracks scroll position instead of the nav
    // being a set of static jump links with no sense of "where you are".
    useEffect(() => {
        const els = allNavItems.map((s) => document.getElementById(s.id)).filter(Boolean);
        if (els.length === 0) return;

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
        els.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Account
                </h2>
            }
        >
            <Head title="Account" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    <ProfileHeader user={user} />

                    {/* Mobile section nav - the sticky desktop sidebar below is lg:-only, so this
                        horizontal pill bar is the only way to jump between sections on small screens,
                        matching Settings.jsx's mobile nav. */}
                    <nav className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:hidden">
                        <div className="flex w-max gap-2">
                            {allNavItems.map((s) => {
                                const danger = dangerSections.includes(s);
                                const active = activeSection === s.id;
                                return (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                                            active
                                                ? danger
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                        {s.label}
                                    </a>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">

                        {/* Section nav */}
                        <nav className="hidden lg:block">
                            <div className="sticky top-24 space-y-1">
                                {allNavItems.map((s) => {
                                    const danger = dangerSections.includes(s);
                                    const active = activeSection === s.id;
                                    return (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            className={`flex items-center gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition ${
                                                active
                                                    ? danger
                                                        ? 'border-red-600 bg-red-50 font-medium text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300'
                                                        : 'border-indigo-600 bg-indigo-50 font-medium text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                    : danger
                                                      ? 'border-transparent text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                                                      : 'border-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                            {s.label}
                                        </a>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Sections */}
                        <div className="space-y-6">
                            <SectionCard {...sections[0]}>
                                <UpdateAvatarForm className="max-w-xl" />
                            </SectionCard>

                            <SectionCard {...sections[1]}>
                                <UpdateAccountInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-xl"
                                />
                            </SectionCard>

                            <SectionCard {...sections[2]}>
                                <UpdatePasswordForm className="max-w-xl" />
                            </SectionCard>

                            {/* Danger zone */}
                            <div className="rounded-xl bg-red-50/40 p-4 pt-4 dark:bg-red-950/10">
                                <div className="mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-red-500">Danger Zone</h3>
                                </div>
                                <div className="space-y-6">
                                    <SectionCard {...dangerSections[0]} danger>
                                        <DeactivateAccountForm className="max-w-xl" />
                                    </SectionCard>

                                    <SectionCard
                                        {...dangerSections[1]}
                                        description={[
                                            dangerSections[1].description[0],
                                            `Even after that, it's kept for ${deletionGraceDays} days before permanent erasure — plenty of time to log back in and restore it.`,
                                        ]}
                                        danger
                                    >
                                        <DeleteUserForm className="max-w-xl" deletionRequestedAt={deletionRequestedAt} deletionGraceDays={deletionGraceDays} />
                                    </SectionCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}