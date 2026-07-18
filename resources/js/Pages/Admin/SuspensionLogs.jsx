import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import BackButton from '@/Components/BackButton';
import TextInput from '@/Components/TextInput';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import SortableHeader from '@/Components/SortableHeader';
import { cleanParams } from '@/utils/queryParams';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { status: 'all', per_page: DEFAULT_PER_PAGE, sort: 'created_at', direction: 'desc' };

export default function SuspensionLogs({ logs, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const [sort, setSort] = useState(filters?.sort ?? 'created_at');
    const [direction, setDirection] = useState(filters?.direction ?? 'desc');

    const applyFilters = () => {
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setPerPage(DEFAULT_PER_PAGE);
        setSort('created_at');
        setDirection('desc');
        router.get(route('admin.suspension-logs'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, per_page: value, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleSort = (column) => {
        const newDirection = sort === column && direction === 'desc' ? 'asc' : 'desc';
        setSort(column);
        setDirection(newDirection);
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, per_page: perPage, sort: column, direction: newDirection }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
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
                        {logs.total} record{logs.total !== 1 ? 's' : ''} match{logs.total === 1 ? 'es' : ''} your filters
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Suspended By</th>
                                    <th className="px-6 py-3">Reason</th>
                                    <SortableHeader label="Until" column="suspended_until" sort={sort} direction={direction} onSort={handleSort} />
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {logs.data.map((log) => (
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
                                {logs.data.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">No suspension history matches your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                            <Pagination meta={logs} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}