import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Linkify from '@/Components/Linkify';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

// Same fade-in ring used to draw the eye to the one note a notification
// link was actually about, without a jarring permanent highlight once
// they've seen it.
function useHighlight(id, highlight) {
    const ref = useRef(null);
    const [lit, setLit] = useState(false);

    useEffect(() => {
        if (highlight !== id || !ref.current) return;
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setLit(true);
        const timeout = setTimeout(() => setLit(false), 3000);
        return () => clearTimeout(timeout);
    }, [id, highlight]);

    return { ref, lit };
}

function ReviewerLine({ admin, autoResolved, timestamp }) {
    const isSystem = autoResolved && !admin;

    return (
        <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar user={admin} system={isSystem} size="h-4 w-4" rounded="rounded-full" className="text-[8px]" />
            <p className="text-xs text-gray-400 dark:text-gray-500">
                {isSystem ? 'Synkro (automated)' : (admin?.name ?? 'Deleted admin')} ·{' '}
                {new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
        </div>
    );
}

function ResponseNote({ response, highlight }) {
    const { ref, lit } = useHighlight(`response:${response.id}`, highlight);
    return (
        <div
            ref={ref}
            className={`rounded-md border p-3 transition-shadow ${
                lit
                    ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300 dark:border-indigo-500 dark:bg-indigo-950/40 dark:ring-indigo-700'
                    : 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30'
            }`}
        >
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Note from support</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                <Linkify text={response.message} />
            </p>
            <ReviewerLine admin={response.admin} timestamp={response.created_at} />
        </div>
    );
}

function AppealCard({ appeal, highlight }) {
    const { ref: appealRef, lit: appealLit } = useHighlight(`appeal:${appeal.id}`, highlight);
    const isPending = appeal.status === 'pending';
    const badgeLabel = isPending
        ? 'pending'
        : appeal.outcome === 'closed'
            ? 'closed (inactive)'
            : appeal.outcome;

    return (
        <div
            ref={appealRef}
            className={`space-y-3 rounded-lg border bg-white p-5 shadow-sm transition-shadow dark:bg-gray-800 ${
                appealLit ? 'border-indigo-400 ring-2 ring-indigo-300 dark:border-indigo-500 dark:ring-indigo-700' : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    Submitted {new Date(appeal.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[isPending ? 'pending' : appeal.outcome] ?? statusStyles.pending}`}>
                    {badgeLabel}
                </span>
            </div>

            <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                    Your message
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <Linkify text={appeal.message} />
                </p>
            </div>

            {appeal.responses?.map((r) => (
                <ResponseNote key={r.id} response={r} highlight={highlight} />
            ))}

            {!isPending && (
                <div className={`rounded-md border p-3 ${
                    appeal.outcome === 'closed'
                        ? 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30'
                        : appeal.outcome === 'approved'
                            ? 'border-green-100 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                            : 'border-red-100 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                }`}>
                    <p className={`mb-1.5 text-xs font-medium uppercase tracking-wide ${
                        appeal.outcome === 'closed'
                            ? 'text-gray-500 dark:text-gray-400'
                            : appeal.outcome === 'approved'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                    }`}>
                        {appeal.outcome === 'closed'
                            ? 'Closed automatically (inactive 24h)'
                            : appeal.outcome === 'approved'
                                ? (appeal.auto_resolved ? 'Approved automatically' : 'Accepted — suspension lifted')
                                : (appeal.auto_resolved ? 'Rejected automatically' : 'Rejected')}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {appeal.admin_reason ? <Linkify text={appeal.admin_reason} /> : 'No reason was given.'}
                    </p>
                    <ReviewerLine admin={appeal.admin} autoResolved={appeal.auto_resolved} timestamp={appeal.updated_at} />
                </div>
            )}
        </div>
    );
}

function SuspensionCard({ log }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${log.lifted_at ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {log.lifted_at ? 'Lifted' : 'Still active'}
                </span>
            </div>
            {log.reason && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <Linkify text={log.reason} />
                </p>
            )}
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Suspended by {log.suspended_by?.name ?? 'Deleted admin'}
                {log.lifted_at && (
                    <>
                        {' · '}Lifted {log.lifted_by ? `by ${log.lifted_by.name}` : 'automatically'}{' on '}
                        {new Date(log.lifted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </>
                )}
            </p>
        </div>
    );
}

export default function AppealHistory({ subjectName, appeals, suspensionLogs, highlight }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Head title="Suspension & Appeal History" />

            <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold">Synkro</span>
                </Link>
                <Link href={route('login')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                    ← Back to login
                </Link>
            </header>

            <main className="mx-auto max-w-3xl space-y-8 px-6 pb-20 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Suspension &amp; Appeal History</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">For {subjectName}'s account</p>
                </div>

                {appeals.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Appeals</h2>
                        <div className="space-y-4">
                            {appeals.map((appeal) => (
                                <AppealCard key={appeal.id} appeal={appeal} highlight={highlight} />
                            ))}
                        </div>
                    </section>
                )}

                {suspensionLogs.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Previous Suspensions</h2>
                        <div className="space-y-3">
                            {suspensionLogs.map((log) => (
                                <SuspensionCard key={log.id} log={log} />
                            ))}
                        </div>
                    </section>
                )}

                {appeals.length === 0 && suspensionLogs.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">There's no suspension or appeal history for this account.</p>
                )}
            </main>
        </div>
    );
}
