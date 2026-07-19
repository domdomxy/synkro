import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import FilterSelect from '@/Components/FilterSelect';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import BackButton from '@/Components/BackButton';
import { Link } from '@inertiajs/react';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    reviewed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    dismissed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
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

    const updateStatus = (status, requireReason = false) => {
        if (requireReason && !reason.trim()) {
            alert('Please add a reason before continuing — it will be included in the email sent to the user.');
            return;
        }
        router.patch(route('admin.appeals.review', appeal.id), { status, reason }, { preserveScroll: true });
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {appeal.user?.name ?? 'Unknown user'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[appeal.status]}`}>
                            {appeal.status}
                        </span>
                        {!appeal.user?.is_suspended && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                No longer suspended
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span>{appeal.user?.email}</span>
                        <span>{new Date(appeal.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                </div>
                <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform mt-1 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

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
                                    <p className="mt-0.5 whitespace-pre-wrap text-red-700 dark:text-red-300">{appeal.user.suspension_reason}</p>
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
                            {appeal.message}
                        </p>
                    </div>

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
                            placeholder="e.g. Thanks for the clarification — we've lifted the suspension."
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {appeal.user?.is_suspended && (
                            <button
                                onClick={() => {
                                    if (!reason.trim()) {
                                        alert('Please add a reason before continuing — it will be included in the email sent to the user.');
                                        return;
                                    }
                                    if (confirm(`Lift ${appeal.user.name}'s suspension and mark this appeal as reviewed?`)) {
                                        router.post(route('admin.users.lift-suspension', appeal.user.id), { reason }, {
                                            preserveScroll: true,
                                            onSuccess: () => updateStatus('reviewed'),
                                        });
                                    }
                                }}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
                            >
                                Lift Suspension & Mark Reviewed
                            </button>
                        )}
                        <button
                            onClick={() => updateStatus('reviewed', true)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                appeal.status === 'reviewed'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Mark Reviewed
                        </button>
                        <button
                            onClick={() => updateStatus('dismissed', true)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                appeal.status === 'dismissed'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Appeals({ appeals, filters }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState(filters?.search ?? '');

    const applySearch = () => router.get(route('admin.appeals'), { search, status: statusFilter !== 'all' ? statusFilter : undefined }, { preserveState: true });

    const filtered = statusFilter === 'all' ? appeals : appeals.filter((a) => a.status === statusFilter);
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
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                placeholder="Search by user name or email..."
                                className="w-64 pl-9"
                            />
                        </div>
                        <button onClick={applySearch} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Filter
                        </button>
                        <FilterSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="w-44"
                            options={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'reviewed', label: 'Reviewed' },
                                { value: 'dismissed', label: 'Dismissed' },
                            ]}
                        />
                        {pendingCount > 0 && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {pendingCount} pending
                            </span>
                        )}
                        <Link href={route('admin.suspension-logs')} className="ml-auto flex items-center gap-1.5 rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Suspension Logs
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
        </AuthenticatedLayout>
    );
}