import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import BackButton from '@/Components/BackButton';
import TextInput from '@/Components/TextInput';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
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

const actionColors = {
    'user.suspended': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    'user.suspension_lifted': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'user.role_changed': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    'user.password_reset': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'appeal.reviewed': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    'appeal.dismissed': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'ticket.status_changed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'ticket.responded': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
};

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { action: 'all', per_page: DEFAULT_PER_PAGE };

export default function Logs({ logs, actionCatalog, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);

    const applyFilters = () => {
        router.get(route('admin.logs'), cleanParams({ search, action, from, to, per_page: perPage }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setAction('all');
        setFrom('');
        setTo('');
        setPerPage(DEFAULT_PER_PAGE);
        router.get(route('admin.logs'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.logs'), cleanParams({ search, action, from, to, per_page: value }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = search !== '' || action !== 'all' || from !== '' || to !== '';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Administration Logs</h2>
            </div>
        }>
            <Head title="Administration Logs" />
            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">

                    <div className="mb-2 flex flex-wrap items-end gap-3">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search by admin or description..."
                                className="w-72 pl-9"
                            />
                        </div>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="all">All Actions</option>
                            {Object.entries(actionCatalog).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <div>
                            <label className="mb-1 block text-xs text-gray-400 dark:text-gray-500">From</label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-gray-400 dark:text-gray-500">To</label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                        </div>
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="pb-2 text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.total} record{logs.total !== 1 ? 's' : ''} match{logs.total === 1 ? 'es' : ''} your filters
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Admin</th>
                                    <th className="px-6 py-3">Action</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar user={log.admin} size="h-7 w-7" />
                                                <span className="truncate text-gray-700 dark:text-gray-300">{log.admin?.name ?? 'Deleted admin'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs ${actionColors[log.action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {actionCatalog[log.action] ?? log.action}
                                            </span>
                                        </td>
                                        <td className="max-w-md truncate px-6 py-3 text-gray-500 dark:text-gray-400" title={log.description}>{log.description}</td>
                                        <td className="whitespace-nowrap px-6 py-3 text-gray-500 dark:text-gray-400">
                                            {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">No administration activity matches your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={logs} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
