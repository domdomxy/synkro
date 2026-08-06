import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Linkify from '@/Components/Linkify';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const timelineIconTone = {
    gray: 'bg-gray-100 text-gray-500 ring-gray-50 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-900',
    amber: 'bg-amber-100 text-amber-600 ring-gray-50 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-gray-900',
    green: 'bg-green-100 text-green-600 ring-gray-50 dark:bg-green-900/40 dark:text-green-400 dark:ring-gray-900',
    red: 'bg-red-100 text-red-600 ring-gray-50 dark:bg-red-900/40 dark:text-red-400 dark:ring-gray-900',
};

function fmt(ts) {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

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

// Generic "this was handled by our support team" mark. Deliberately not tied
// to any individual admin's name or avatar - who specifically suspended or
// reviewed an account isn't shown here, only that Synkro did (or an
// automated rule did, which keeps the existing distinct mark).
function SupportBadge() {
    return (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-indigo-500 dark:bg-indigo-900 dark:text-indigo-400">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5-2V7a2 2 0 00-1.106-1.789l-6-3a2 2 0 00-1.788 0l-6 3A2 2 0 004 7v3c0 5.591 3.824 9.377 8 10.5 4.176-1.123 8-4.909 8-10.5z" />
            </svg>
        </span>
    );
}

function ReviewerLine({ autoResolved, timestamp }) {
    return (
        <div className="mt-1.5 flex items-center gap-1.5">
            {autoResolved ? (
                <Avatar system size="h-4 w-4" rounded="rounded-full" className="text-[8px]" />
            ) : (
                <SupportBadge />
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
                {autoResolved ? 'Synkro (automated)' : 'Synkro support'} · {fmt(timestamp)}
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
            <ReviewerLine autoResolved={false} timestamp={response.created_at} />
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
            className={`space-y-3 rounded-xl border bg-white p-5 shadow-sm transition-shadow dark:bg-gray-800 ${
                appealLit ? 'border-indigo-400 ring-2 ring-indigo-300 dark:border-indigo-500 dark:ring-indigo-700' : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Appeal submitted {fmt(appeal.created_at)}</span>
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
                    <ReviewerLine autoResolved={appeal.auto_resolved} timestamp={appeal.updated_at} />
                </div>
            )}
        </div>
    );
}

function SuspensionCard({ log }) {
    const lifted = Boolean(log.lifted_at);
    return (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Suspended {fmt(log.created_at)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${lifted ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                    {lifted ? 'Lifted' : 'Still active'}
                </span>
            </div>
            {log.reason && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <Linkify text={log.reason} />
                </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
                Suspended by Synkro support
                {lifted && <>{' · '}Lifted {log.lifted_by ? 'by Synkro support' : 'automatically'} on {fmt(log.lifted_at)}</>}
            </p>
        </div>
    );
}

function TimelineIcon({ tone, children }) {
    return (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ${timelineIconTone[tone]}`}>
            {children}
        </span>
    );
}

const appealIconPath = 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
const suspensionIconPath = 'M18.364 5.636a9 9 0 11-12.728 0m12.728 0A9 9 0 015.636 5.636m12.728 0L5.636 18.364';

function appealTone(appeal) {
    if (appeal.status === 'pending') return 'amber';
    if (appeal.outcome === 'approved') return 'green';
    if (appeal.outcome === 'rejected') return 'red';
    return 'gray';
}

// Appeals and suspensions are two different records, but to the reader
// they're one continuous story ("this happened, then that happened") - so
// they're merged into a single chronological rail instead of two disconnected
// lists the reader has to cross-reference by eye.
function useTimeline(appeals, suspensionLogs) {
    return useMemo(() => {
        const items = [
            ...appeals.map((appeal) => ({ kind: 'appeal', at: appeal.created_at, appeal })),
            ...suspensionLogs.map((log) => ({ kind: 'suspension', at: log.created_at, log })),
        ];
        items.sort((a, b) => new Date(b.at) - new Date(a.at));
        return items;
    }, [appeals, suspensionLogs]);
}

function StatusBanner({ isSuspended, suspendedUntil, suspensionReason }) {
    if (!isSuspended) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/60 px-4 py-3 dark:border-green-900 dark:bg-green-950/20">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </span>
                <p className="text-sm text-green-700 dark:text-green-300">This account is not currently suspended.</p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 dark:border-red-900 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={suspensionIconPath} />
                    </svg>
                </span>
                <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        This account is currently suspended {suspendedUntil ? `until ${fmt(suspendedUntil)}` : 'indefinitely'}.
                    </p>
                </div>
            </div>
            {suspensionReason && (
                <p className="ml-11 whitespace-pre-wrap text-sm leading-relaxed text-red-700/90 dark:text-red-300/90">
                    <Linkify text={suspensionReason} />
                </p>
            )}
        </div>
    );
}

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
    const timeline = useTimeline(appeals, suspensionLogs);
    const hasHistory = timeline.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Head title="Suspension & Appeal History" />

            <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
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

            <main className="mx-auto max-w-3xl space-y-6 px-6 pb-20 pt-4">
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

                <StatusBanner isSuspended={isSuspended} suspendedUntil={suspendedUntil} suspensionReason={suspensionReason} />

                {hasHistory ? (
                    <div className="relative">
                        <div className="absolute bottom-2 left-[17px] top-2 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                        <div className="space-y-6">
                            {timeline.map((item) => (
                                <div key={`${item.kind}:${item.kind === 'appeal' ? item.appeal.id : item.log.id}`} className="relative flex items-start gap-4">
                                    {item.kind === 'appeal' ? (
                                        <>
                                            <TimelineIcon tone={appealTone(item.appeal)}>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={appealIconPath} />
                                                </svg>
                                            </TimelineIcon>
                                            <div className="min-w-0 flex-1">
                                                <AppealCard appeal={item.appeal} highlight={highlight} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <TimelineIcon tone={item.log.lifted_at ? 'green' : 'red'}>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={suspensionIconPath} />
                                                </svg>
                                            </TimelineIcon>
                                            <div className="min-w-0 flex-1">
                                                <SuspensionCard log={item.log} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-700">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">There's no suspension or appeal history for this account.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
