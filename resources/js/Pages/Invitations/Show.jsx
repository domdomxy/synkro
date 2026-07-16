import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Show({ invitation }) {
    const acceptForm = useForm({});
    const denyForm = useForm({});

    const accept = () => acceptForm.post(route('invitations.accept', invitation.token));
    const deny = () => {
        if (confirm('Decline this invitation?')) denyForm.post(route('invitations.deny', invitation.token));
    };

    if (invitation.status !== 'pending') {
        const accepted = invitation.status === 'accepted';
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
                <Head title="Invitation" />
                <div className="w-full max-w-lg rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                        accepted ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {accepted ? (
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
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
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <Head title="Project Invitation" />
            <div className="w-full max-w-lg rounded-lg bg-white p-10 shadow dark:bg-gray-800">
                <div className="mb-6 flex justify-center">
                    <ApplicationLogo className="h-12 w-12 fill-current text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {invitation.invited_by.name} invited you to join
                </h1>
                <p className="mt-2 text-center text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {invitation.project.name}
                </p>
                <p className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">Project ID: {invitation.project_id}</p>

                {invitation.project.description && (
                    <div
                        className="mt-5 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: invitation.project.description }}
                    />
                )}

                <p className="mt-5 text-center text-base text-gray-500 dark:text-gray-400">
                    You'll join as <span className="font-medium capitalize text-gray-700 dark:text-gray-300">{invitation.role}</span>.
                </p>

                <div className="mt-8 flex gap-3">
                    <button onClick={deny} disabled={denyForm.processing} className="flex-1 rounded-md border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        Decline
                    </button>
                    <button onClick={accept} disabled={acceptForm.processing} className="flex-1 rounded-md bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        Accept
                    </button>
                </div>

                <p className="mt-4 text-center">
                    <Link href={route('projects.index')} className="text-sm text-gray-400 hover:underline dark:text-gray-500">
                        ← Back to Projects
                    </Link>
                </p>
            </div>
        </div>
    );
}