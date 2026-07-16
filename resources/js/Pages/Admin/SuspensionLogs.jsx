import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import BackButton from '@/Components/BackButton';
import TextInput from '@/Components/TextInput';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

export default function SuspensionLogs({ logs, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');

    const applyFilters = () => {
        router.get(route('admin.suspension-logs'), { search, status }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        router.get(route('admin.suspension-logs'));
    };

    const hasActiveFilters = search !== '' || status !== 'all';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('admin.appeals')} label="Back to Appeals" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Suspension Logs</h2>
            </div>
        }>
            <Head title="Suspension Logs" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">

                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search by user, admin, or reason..."
                                className="w-72 pl-9"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Currently Suspended</option>
                            <option value="lifted">Lifted</option>
                        </select>
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.length} record{logs.length !== 1 ? 's' : ''} match{logs.length === 1 ? 'es' : ''} your filters
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Suspended By</th>
                                    <th className="px-6 py-3">Reason</th>
                                    <th className="px-6 py-3">Until</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {logs.map((log) => (
                                    <tr key={log.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar user={log.user} size="h-7 w-7" />
                                                <span className="truncate text-gray-700 dark:text-gray-300">{log.user?.name ?? 'Deleted user'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{log.suspended_by?.name}</td>
                                        <td className="max-w-xs truncate px-6 py-3 text-gray-500 dark:text-gray-400" title={log.reason}>{log.reason}</td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                                            {log.suspended_until ? new Date(log.suspended_until).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Permanent'}
                                        </td>
                                        <td className="px-6 py-3">
                                            {log.lifted_at ? (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                                                    {log.lifted_by
                                                        ? `Lifted ${new Date(log.lifted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })} by ${log.lifted_by.name}`
                                                        : `Automatically lifted on ${new Date(log.lifted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">No suspension history matches your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}