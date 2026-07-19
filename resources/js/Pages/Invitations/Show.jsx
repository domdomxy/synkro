import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

function StateCard({ iconBg, iconColor, icon, children }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <Head title="Invitation" />
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Show({ invitation, rejoinBlocked, revoked }) {
    const acceptForm = useForm({});
    const denyForm = useForm({});

    const accept = () => acceptForm.post(route('invitations.accept', invitation.token));
    const deny = () => {
        if (confirm('Decline this invitation?')) denyForm.post(route('invitations.deny', invitation.token));
    };

    if (revoked) {
        return (
            <StateCard
                iconBg="bg-gray-100 dark:bg-gray-700"
                iconColor="text-gray-500 dark:text-gray-400"
                icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                    </svg>
                }
            >
                <p className="text-gray-600 dark:text-gray-300">
                    This invitation to <span className="font-medium text-gray-900 dark:text-gray-100">{invitation.project.name}</span> was cancelled
                    by the project owner or a manager.
                </p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                    Ask them to send you a new invitation if this was unexpected.
                </p>
                <div className="mt-6">
                    <Link href={route('projects.index')} className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Back to Projects
                    </Link>
                </div>
            </StateCard>
        );
    }

    if (rejoinBlocked) {
        return (
            <StateCard
                iconBg="bg-amber-100 dark:bg-amber-900/40"
                iconColor="text-amber-600 dark:text-amber-400"
                icon={
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                }
            >
                <p className="text-gray-600 dark:text-gray-300">
                    You can't rejoin <span className="font-medium text-gray-900 dark:text-gray-100">{invitation.project.name}</span> using this invitation —
                    you've since left or been removed from the project.
                </p>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                    Ask the project owner or a manager to invite you again.
                </p>
                <div className="mt-6">
                    <Link href={route('projects.index')} className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Back to Projects
                    </Link>
                </div>
            </StateCard>
        );
    }

    if (invitation.status !== 'pending') {
        const accepted = invitation.status === 'accepted';
        return (
            <StateCard
                iconBg={accepted ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}
                iconColor={accepted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}
                icon={accepted ? (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            >
                <p className="text-gray-600 dark:text-gray-300">
                    You already {accepted ? 'accepted' : 'declined'} this invitation to <span className="font-medium text-gray-900 dark:text-gray-100">{invitation.project.name}</span>.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href={route('projects.index')} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Back to Projects
                    </Link>
                    {accepted && (
                        <Link href={route('projects.show', invitation.project_id)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Go to Project
                        </Link>
                    )}
                </div>
            </StateCard>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <Head title="Project Invitation" />
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                <div className="mb-5 flex justify-center">
                    <ApplicationLogo className="h-11 w-11 fill-current text-indigo-600 dark:text-indigo-400" />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{invitation.invited_by.name}</span> invited you to join
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {invitation.project.name}
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium capitalize text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Joining as {invitation.role}
                </span>

                <div className="mt-8 flex gap-3">
                    <button onClick={deny} disabled={denyForm.processing} className="flex-1 rounded-md border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Decline
                    </button>
                    <button onClick={accept} disabled={acceptForm.processing} className="flex-1 rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        Accept
                    </button>
                </div>

                <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">Project ID: {invitation.project_id}</p>

                <p className="mt-4 text-center">
                    <Link href={route('projects.index')} className="text-sm text-gray-400 hover:underline dark:text-gray-500">
                        ← Back to Projects
                    </Link>
                </p>
            </div>
        </div>
    );
}
