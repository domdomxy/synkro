import ApplicationLogo from '@/Components/ApplicationLogo';
import AppealHistoryTimeline from '@/Components/AppealHistoryTimeline';
import { Head, Link } from '@inertiajs/react';

export default function AppealHistory({
    subjectName,
    appeals,
    suspensionLogs,
    highlight,
    isSuspended = false,
    suspendedUntil = null,
    suspensionReason = null,
    viewingAsAdmin = false,
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Head title="Suspension & Appeal History" />

            <header className="mx-auto flex max-w-8xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold">Synkro</span>
                </Link>
                {viewingAsAdmin ? (
                    <Link href={route('admin.appeals')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                        ← Back to Appeals
                    </Link>
                ) : (
                    <Link href={route('login')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                        ← Back to login
                    </Link>
                )}
            </header>

            <main className="mx-auto max-w-8xl space-y-6 px-6 pb-20 pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Suspension &amp; Appeal History</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">For {subjectName}'s account</p>
                    </div>
                    {viewingAsAdmin && (
                        <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Admin view
                        </span>
                    )}
                </div>

                <AppealHistoryTimeline
                    appeals={appeals}
                    suspensionLogs={suspensionLogs}
                    highlight={highlight}
                    isSuspended={isSuspended}
                    suspendedUntil={suspendedUntil}
                    suspensionReason={suspensionReason}
                />
            </main>
        </div>
    );
}
