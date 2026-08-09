import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import Linkify from '@/Components/Linkify';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import BackButton from '@/Components/BackButton';
import { Link } from '@inertiajs/react';
import useConfirm from '@/hooks/useConfirm';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function AppealItem({ appeal }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [showNote, setShowNote] = useState(false);
    const [sendingNote, setSendingNote] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const isPending = appeal.status === 'pending';
    const badgeLabel = isPending
        ? 'pending'
        : appeal.outcome === 'closed'
            ? 'closed (inactive)'
            : appeal.outcome === 'approved'
                ? (appeal.auto_resolved ? 'approved (automatically)' : 'approved')
                : (appeal.auto_resolved ? 'rejected (automatically)' : 'rejected');
    const badgeStyle = isPending
        ? statusStyles.pending
        : appeal.outcome === 'closed'
            ? statusStyles.closed
            : appeal.outcome === 'approved'
                ? statusStyles.approved
                : statusStyles.rejected;

    const decide = async (outcome) => {
        if (!reason.trim()) {
            await confirm('Please add a reason before continuing - it will be included in the email sent to the user.', {
                title: 'Reason required',
                hideCancel: true,
                confirmLabel: 'OK',
            });
            return;
        }
        const confirmTitle = outcome === 'approved' ? 'Lift Suspension?' : 'Reject Appeal?';
        const confirmText = outcome === 'approved'
            ? `Lift ${appeal.user?.name ?? 'this user'}'s suspension and accept this appeal?`
            : `Reject this appeal?`;
        if (!(await confirm(confirmText, { title: confirmTitle }))) return;
        router.patch(route('admin.appeals.review', appeal.id), { outcome, reason }, { preserveScroll: true });
    };

    const sendNote = () => {
        if (!note.trim()) return;
        setSendingNote(true);
        router.patch(route('admin.appeals.respond', appeal.id), { message: note }, {
            preserveScroll: true,
            onSuccess: () => { setNote(''); setShowNote(false); },
            onFinish: () => setSendingNote(false),
        });
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex w-full items-start gap-3 p-4">
                <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-start gap-3 text-left">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {appeal.user?.name ?? 'Unknown user'}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${badgeStyle}`}>
                                {badgeLabel}
                            </span>
                            {!appeal.user?.is_suspended && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                    No longer suspended
                                </span>
                            )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                            <span>{appeal.user?.email}</span>
                            <span>{new Date(appeal.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                    </div>
                    <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform mt-1 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {appeal.user?.id && (
                    <Link
                        href={route('appeal.history', appeal.user.id)}
                        target="_blank"
                        title="View full suspension & appeal history"
                        className="mt-0.5 shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                )}
            </div>

            {open && (
                <div className="border-t border-gray-100 p-4 space-y-4 dark:border-gray-700">
                    {appeal.user?.is_suspended && (
                        <div className="rounded-md bg-red-50 p-3 text-sm dark:bg-red-950/30">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-red-500 dark:text-red-400">Current suspension</p>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                    appeal.user.suspended_until
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        : 'bg-red-600 text-white dark:bg-red-700'
                                }`}>
                                    {appeal.user.suspended_until
                                        ? `Until ${new Date(appeal.user.suspended_until).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                                        : 'Permanent'}
                                </span>
                            </div>
                            {appeal.user.suspension_reason && (
                                <div className="mt-2 rounded-md border-l-2 border-red-300 bg-white/60 px-3 py-2 dark:border-red-700 dark:bg-black/10">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-red-400 dark:text-red-500">Reason given at the time</p>
                                    <p className="mt-0.5 whitespace-pre-wrap text-red-700 dark:text-red-300"><Linkify text={appeal.user.suspension_reason} /></p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="rounded-md border border-sky-100 bg-sky-50/50 p-3 dark:border-sky-900 dark:bg-sky-950/20">
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sky-500 dark:text-sky-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Appeal message from {appeal.user?.name ?? 'the user'}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                            <Linkify text={appeal.message} />
                        </p>
                    </div>

                    {appeal.responses?.length > 0 && (
                        <div className="space-y-2">
                            {appeal.responses.map((r) => (
                                <div key={r.id} className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                        <Linkify text={r.message} />
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <Avatar user={r.admin} size="h-4 w-4" rounded="rounded-full" className="text-[8px]" />
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {r.admin?.name ?? 'Deleted admin'} ·{' '}
                                            {new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isPending && showNote && (
                        <div className="rounded-md border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Leave a note without deciding yet (emailed to {appeal.user?.name ?? 'the user'})
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                placeholder="e.g. Thanks for reaching out - we're looking into this and will follow up soon."
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={sendNote}
                                    disabled={!note.trim() || sendingNote}
                                    className="w-full shrink-0 rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-1.5"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    )}

                    {isPending ? (
                        <>
                            <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Your reason (included in the email sent to {appeal.user?.name ?? 'the user'})
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Thanks for the clarification - we've lifted the suspension."
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <button
                                    onClick={() => decide('approved')}
                                    className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-500 sm:py-1.5"
                                >
                                    Lift Suspension
                                </button>
                                <button
                                    onClick={() => decide('rejected')}
                                    className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 sm:py-1.5"
                                >
                                    Rejected
                                </button>
                                <button
                                    onClick={() => setShowNote((v) => !v)}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:py-1.5"
                                >
                                    {showNote ? 'Hide Note' : 'Leave a Note'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={`rounded-md border p-3 ${
                            appeal.outcome === 'closed'
                                ? 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30'
                                : appeal.outcome === 'approved'
                                    ? 'border-green-100 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                                    : 'border-red-100 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                        }`}>
                            <p className={`mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${
                                appeal.outcome === 'closed'
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : appeal.outcome === 'approved'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                            }`}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    {appeal.outcome === 'closed' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    ) : appeal.outcome === 'approved' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    )}
                                </svg>
                                {appeal.outcome === 'closed'
                                    ? 'Closed automatically (inactive 24h)'
                                    : appeal.outcome === 'approved'
                                        ? (appeal.auto_resolved ? 'Approved automatically' : 'Accepted - suspension lifted')
                                        : (appeal.auto_resolved ? 'Rejected automatically' : 'Rejected')}
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {appeal.admin_reason ? <Linkify text={appeal.admin_reason} /> : 'No reason was given.'}
                            </p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                                <Avatar
                                    user={appeal.admin}
                                    system={appeal.auto_resolved && !appeal.admin}
                                    size="h-4 w-4"
                                    rounded="rounded-full"
                                    className="text-[8px]"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {appeal.auto_resolved && !appeal.admin
                                        ? 'Synkro (automated)'
                                        : (appeal.admin?.name ?? 'Deleted admin')} ·{' '}
                                    {new Date(appeal.updated_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {ConfirmDialog}
        </div>
    );
}

export default function Appeals({ appeals, filters }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState(filters?.search ?? '');
    const toolbarRef = useRef(null);

    const applySearch = () => router.get(route('admin.appeals'), { search, status: statusFilter !== 'all' ? statusFilter : undefined }, { preserveState: true });

    const filtered = appeals.filter((a) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return a.status === 'pending';
        return a.status !== 'pending' && a.outcome === statusFilter;
    });
    const pendingCount = appeals.filter((a) => a.status === 'pending').length;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Suspension Appeals</h2>
            </div>
        }>
            <Head title="Admin - Appeals" />
            <div className="py-12">
                <div className="mx-auto max-w-8xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div ref={toolbarRef} className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                placeholder="Search by user name or email..."
                                className="w-full pl-9"
                            />
                        </div>
                        <FiltersMenu
                            activeCount={statusFilter !== 'all' ? 1 : 0}
                            hasActiveFilters={statusFilter !== 'all'}
                            onClear={() => setStatusFilter('all')}
                        >
                            <FiltersMenu.Row label="Status">
                                <FilterSelect
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    className="w-full"
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                        { value: 'closed', label: 'Closed (inactive)' },
                                    ]}
                                />
                            </FiltersMenu.Row>
                        </FiltersMenu>
                        {pendingCount > 0 && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {pendingCount} pending
                            </span>
                        )}
                        <Link href={route('admin.suspension-logs')} className="ml-auto flex items-center gap-1.5 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 sm:px-4">
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="hidden sm:inline">Suspension Logs</span>
                            <span className="sm:hidden">Logs</span>
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                                {appeals.length === 0 ? 'No appeals submitted yet.' : 'No appeals match this filter.'}
                            </p>
                        ) : (
                            filtered.map((a) => <AppealItem key={a.id} appeal={a} />)
                        )}
                    </div>
                </div>
            </div>

            <ScrollToPaginationButton targetRef={toolbarRef} />
        </AuthenticatedLayout>
    );
}