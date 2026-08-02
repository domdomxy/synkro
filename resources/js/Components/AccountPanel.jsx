import Modal from '@/Components/Modal';
import SectionSelect from '@/Components/SectionSelect';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Avatar from '@/Components/Avatar';
import DeleteUserForm from '@/Pages/Account/Partials/DeleteUserForm';
import UpdatePasswordForm from '@/Pages/Account/Partials/UpdatePasswordForm';
import UpdateAccountInformationForm from '@/Pages/Account/Partials/UpdateAccountInformationForm';
import UpdateAvatarForm from '@/Pages/Account/Partials/UpdateAvatarForm';
import DeactivateAccountForm from '@/Pages/Account/Partials/DeactivateAccountForm';
import { useRouteOverlayActions } from '@/hooks/useRouteOverlay';

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

function CloseIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function WarningIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

// Section nav (left sidebar on desktop, dropdown on mobile) - same pattern as
// the Settings and Help & Feedback dialogs, so all three read as the same
// kind of panel instead of three different page shapes.
const accountNavItems = [
    {
        id: 'avatar',
        label: 'Avatar',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        id: 'account-information',
        label: 'Account Information',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        id: 'update-password',
        label: 'Password',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
];

const dangerNavItems = [
    {
        id: 'deactivate-account',
        label: 'Deactivate Account',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
    },
    {
        id: 'delete-account',
        label: 'Delete Account',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
];

const allNavItems = [...accountNavItems, ...dangerNavItems];

// Title + description shown in the modal's header bar for whichever section is active,
// same SECTION_META pattern as Settings.jsx.
function buildSectionMeta(deletionGraceDays) {
    return {
        avatar: { title: 'Avatar', description: 'Update your account picture' },
        'account-information': { title: 'Account Information', description: "Update your account's name and email address" },
        'update-password': { title: 'Password', description: 'Ensure your account is using a long, random password to stay secure' },
        'deactivate-account': { title: 'Deactivate Account', description: 'Log you out and freeze your active task submissions' },
        'delete-account': { title: 'Delete Account', description: `Removed after a ${deletionGraceDays}-day grace period` },
    };
}

export default function AccountPanel({ mustVerifyEmail, status, deletionRequestedAt, deletionGraceDays, onClose }) {
    const overlayActions = useRouteOverlayActions();
    // auth.user is a shared prop attached to every page for the logged-in
    // user, so this stays correct whether AccountPanel is the live page
    // (standalone visit) or an overlay on top of a different live page.
    const user = usePage().props.auth.user;
    const [activeSection, setActiveSection] = useState(() => (deletionRequestedAt ? 'delete-account' : allNavItems[0].id));
    const SECTION_META = buildSectionMeta(deletionGraceDays);

    return (
        <>
            <Modal show onClose={onClose} maxWidth="6xl" overlayClassName="bg-black/55 dark:bg-black/70" panelClassName="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex h-[88vh] max-h-[860px] w-full flex-col">

                    {/* Mobile section nav - the fixed sidebar below is desktop-only (sm:), so this
                        dropdown is the only way to switch sections on small screens. */}
                    <div className="shrink-0 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:hidden">
                        <SectionSelect
                            groups={[
                                { label: 'Account', items: accountNavItems },
                                { label: 'Danger Zone', items: dangerNavItems, danger: true },
                            ]}
                            value={activeSection}
                            onChange={setActiveSection}
                        />
                    </div>

                    <div className="flex min-h-0 flex-1">

                        {/* Section nav */}
                        <nav className="hidden w-56 shrink-0 flex-col border-r border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-black/20 sm:flex">
                            <div className="mb-2 flex items-center gap-2.5 px-3 pb-2 pt-1">
                                <Avatar user={user} size="h-8 w-8" rounded="rounded-lg" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                {accountNavItems.map((s) => (
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
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <p className="px-3 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-red-400 dark:text-red-500/80">
                                Danger Zone
                            </p>
                            <div className="space-y-0.5">
                                {dangerNavItems.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setActiveSection(s.id)}
                                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition ${
                                            activeSection === s.id
                                                ? 'bg-red-50 font-medium text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-300'
                                                : 'text-red-500 hover:bg-red-50 dark:text-red-400/80 dark:hover:bg-red-950/20'
                                        }`}
                                    >
                                        <span className="h-4 w-4 shrink-0">{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto space-y-0.5 border-t border-gray-200 pt-2 dark:border-gray-700">
                                {overlayActions?.switchToSettings ? (
                                    <button
                                        type="button"
                                        onClick={overlayActions.switchToSettings}
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60"
                                    >
                                        <SettingsIcon className="h-4 w-4 shrink-0" />
                                        Settings
                                    </button>
                                ) : (
                                    <Link
                                        href={route('settings.edit')}
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60"
                                    >
                                        <SettingsIcon className="h-4 w-4 shrink-0" />
                                        Settings
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
                            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-6 py-3.5 dark:border-gray-800">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {SECTION_META[activeSection]?.title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                >
                                    <CloseIcon className="h-5 w-5" />
                                    <span className="sr-only">Close account settings</span>
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-6">

                                {activeSection === 'avatar' && (
                                    <UpdateAvatarForm className="max-w-xl" />
                                )}

                                {activeSection === 'account-information' && (
                                    <UpdateAccountInformationForm
                                        mustVerifyEmail={mustVerifyEmail}
                                        status={status}
                                        className="max-w-xl"
                                    />
                                )}

                                {activeSection === 'update-password' && (
                                    <UpdatePasswordForm className="max-w-xl" />
                                )}

                                {activeSection === 'deactivate-account' && (
                                    <div>
                                        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                                            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <p className="text-xs text-red-700 dark:text-red-300">
                                                Deactivating your account will log you out and freeze your active task submissions.
                                                You can reactivate at any time by logging back in.
                                            </p>
                                        </div>
                                        <DeactivateAccountForm className="max-w-xl" />
                                    </div>
                                )}

                                {activeSection === 'delete-account' && (
                                    <div>
                                        <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                                            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <p className="text-xs text-red-700 dark:text-red-300">
                                                We'll email you a confirmation link first. Your account isn't deleted until you click it.
                                                Even after that, it's kept for {deletionGraceDays} days before permanent erasure — plenty of time to log back in and restore it.
                                            </p>
                                        </div>
                                        <DeleteUserForm className="max-w-xl" deletionRequestedAt={deletionRequestedAt} deletionGraceDays={deletionGraceDays} />
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
