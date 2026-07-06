import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateAvatarForm from './Partials/UpdateAvatarForm';
import DeactivateAccountForm from './Partials/DeactivateAccountForm';

const sections = [
    {
        id: 'avatar',
        label: 'Avatar',
        description: 'Update your profile picture.',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        id: 'profile-information',
        label: 'Profile Information',
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
        description: 'Deactivating your account will log you out and freeze your active task submissions.You can reactivate at any time by logging back in.',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
    },
    {
        id: 'delete-account',
        label: 'Delete Account',
        description: 'Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.',
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
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

export default function Edit({ mustVerifyEmail, status }) {
    const allNavItems = [...sections, ...dangerSections];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">

                        {/* Section nav */}
                        <nav className="hidden lg:block">
                            <div className="sticky top-24 space-y-1">
                                {allNavItems.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                                            dangerSections.includes(s)
                                                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
                                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
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
                            <SectionCard {...sections[0]}>
                                <UpdateAvatarForm className="max-w-xl" />
                            </SectionCard>

                            <SectionCard {...sections[1]}>
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-xl"
                                />
                            </SectionCard>

                            <SectionCard {...sections[2]}>
                                <UpdatePasswordForm className="max-w-xl" />
                            </SectionCard>

                            {/* Danger zone */}
                            <div className="pt-4">
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

                                    <SectionCard {...dangerSections[1]} danger>
                                        <DeleteUserForm className="max-w-xl" />
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