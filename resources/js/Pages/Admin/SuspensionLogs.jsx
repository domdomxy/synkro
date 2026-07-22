import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import BackButton from '@/Components/BackButton';
import TextInput from '@/Components/TextInput';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import FilterSelect from '@/Components/FilterSelect';
import Linkify from '@/Components/Linkify';
import DateRangeFilter from '@/Components/DateRangeFilter';
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

function ChevronIcon({ open }) {
    return (
        <svg
            className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function StatusIcon({ lifted, className }) {
    return lifted ? (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
    );
}

function SuspensionLogRow({ log }) {
    const [open, setOpen] = useState(false);
    const lifted = Boolean(log.lifted_at);

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
                <span className={`mt-0.5 shrink-0 ${lifted ? 'text-green-500' : 'text-red-500'}`}>
                    <StatusIcon lifted={lifted} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Avatar user={log.user} size="h-5 w-5" />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.user?.name ?? 'Deleted user'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                            lifted
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                            {lifted ? 'Lifted' : 'Active'}
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        Suspended {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {log.suspended_by?.name && <span> by {log.suspended_by.name}</span>}
                    </p>
                </div>
                <ChevronIcon open={open} />
            </button>

            {open && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                    <dl className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Reason</dt>
                            <dd className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                                {log.reason ? <Linkify text={log.reason} /> : <span className="italic text-gray-400 dark:text-gray-500">No reason given</span>}
                            </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Until</dt>
                            <dd className="text-sm text-gray-700 dark:text-gray-300">
                                {log.suspended_until
                                    ? new Date(log.suspended_until).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'Permanent'}
                            </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Status</dt>
                            <dd className="text-sm text-gray-700 dark:text-gray-300">
                                {lifted
                                    ? (log.lifted_by
                                        ? `Lifted ${new Date(log.lifted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} by ${log.lifted_by.name}`
                                        : `Automatically lifted ${new Date(log.lifted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`)
                                    : 'Still active'}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </li>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { status: 'all', per_page: DEFAULT_PER_PAGE, sort: 'created_at', direction: 'desc' };

export default function SuspensionLogs({ logs, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const [sort, setSort] = useState(filters?.sort ?? 'created_at');
    const [direction, setDirection] = useState(filters?.direction ?? 'desc');

    const applyFilters = () => {
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from, to, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true });
    };

    const applyDateRange = (newFrom, newTo) => {
        setFrom(newFrom);
        setTo(newTo);
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from: newFrom, to: newTo, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setFrom('');
        setTo('');
        setPerPage(DEFAULT_PER_PAGE);
        setSort('created_at');
        setDirection('desc');
        router.get(route('admin.suspension-logs'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from, to, per_page: value, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = search !== '' || status !== 'all' || from !== '' || to !== '';

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
                        <FilterSelect
                            value={status}
                            onChange={setStatus}
                            className="w-48"
                            options={[
                                { value: 'all', label: 'All Statuses' },
                                { value: 'active', label: 'Currently Suspended' },
                                { value: 'lifted', label: 'Lifted' },
                            ]}
                        />
                        <FilterSelect
                            value={`${sort}:${direction}`}
                            onChange={(v) => {
                                const [col, dir] = v.split(':');
                                setSort(col);
                                setDirection(dir);
                                router.get(route('admin.suspension-logs'), cleanParams({ search, status, from, to, per_page: perPage, sort: col, direction: dir }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
                            }}
                            className="w-48"
                            options={[
                                { value: 'created_at:desc', label: 'Newest first' },
                                { value: 'created_at:asc', label: 'Oldest first' },
                                { value: 'suspended_until:asc', label: 'Ends soonest' },
                                { value: 'suspended_until:desc', label: 'Ends latest' },
                            ]}
                        />
                        <DateRangeFilter from={from} to={to} onApply={applyDateRange} />
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.total} record{logs.total !== 1 ? 's' : ''} match{logs.total === 1 ? 'es' : ''} your filters
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {logs.data.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {hasActiveFilters ? 'No suspension history matches your filters.' : 'No suspension history recorded yet.'}
                                </p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul>
                                {logs.data.map((log) => (
                                    <SuspensionLogRow key={log.id} log={log} />
                                ))}
                            </ul>
                        )}
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