import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    reviewed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    dismissed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function AppealItem({ appeal }) {
    const [open, setOpen] = useState(false);

    const updateStatus = (status) => {
        router.patch(route('admin.appeals.review', appeal.id), { status }, { preserveScroll: true });
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
                            <p className="text-xs font-medium uppercase tracking-wide text-red-500 dark:text-red-400">Current suspension</p>
                            <p className="mt-1 text-red-700 dark:text-red-300">
                                {appeal.user.suspended_until
                                    ? `Until ${new Date(appeal.user.suspended_until).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                                    : 'Permanent'}
                            </p>
                            {appeal.user.suspension_reason && (
                                <p className="mt-1 text-red-600 dark:text-red-400">Reason: {appeal.user.suspension_reason}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Appeal message</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{appeal.message}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {appeal.user?.is_suspended && (
                            <button
                                onClick={() => {
                                    if (confirm(`Lift ${appeal.user.name}'s suspension and mark this appeal as reviewed?`)) {
                                        router.post(route('admin.users.lift-suspension', appeal.user.id), {}, {
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
                            onClick={() => updateStatus('reviewed')}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                appeal.status === 'reviewed'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Mark Reviewed
                        </button>
                        <button
                            onClick={() => updateStatus('dismissed')}
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

export default function Appeals({ appeals }) {
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = statusFilter === 'all' ? appeals : appeals.filter((a) => a.status === statusFilter);
    const pendingCount = appeals.filter((a) => a.status === 'pending').length;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Suspension Appeals</h2>}>
            <Head title="Admin - Appeals" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                        {pendingCount > 0 && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {pendingCount} pending
                            </span>
                        )}
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