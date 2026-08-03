import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import BackButton from '@/Components/BackButton';
import TextInput from '@/Components/TextInput';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import Linkify from '@/Components/Linkify';
import DateRangeFilter from '@/Components/DateRangeFilter';
import { cleanParams } from '@/utils/queryParams';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

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
                <span className="relative mt-0.5 h-8 w-8 shrink-0">
                    <Avatar user={log.user} size="h-8 w-8" rounded="rounded-full" />
                    <span
                        className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800 ${lifted ? 'text-green-500' : 'text-red-500'}`}
                    >
                        <StatusIcon lifted={lifted} className="h-2.5 w-2.5" />
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
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
                            <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Until</dt>
                            <dd className="text-sm text-gray-700 dark:text-gray-300">
                                {log.suspended_until
                                    ? new Date(log.suspended_until).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'Permanent'}
                            </dd>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Status</dt>
                            <dd className="text-sm text-gray-700 dark:text-gray-300">
                                {lifted
                                    ? (log.lifted_by
                                        ? `Lifted ${new Date(log.lifted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} by ${log.lifted_by.name}`
                                        : `Automatically lifted ${new Date(log.lifted_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`)
                                    : 'Still active'}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.17 6.17A5 5 0 002 11c0 2.21 1.34 4.11 3.26 4.92A3 3 0 008 20a1 1 0 100-2 1 1 0 010-2 3 3 0 002.9-3.78A5 5 0 007.17 6.17zM17.17 6.17A5 5 0 0012 11c0 2.21 1.34 4.11 3.26 4.92A3 3 0 0018 20a1 1 0 100-2 1 1 0 010-2 3 3 0 002.9-3.78 5 5 0 00-4.73-5.05z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Reason</p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {log.reason ? <Linkify text={log.reason} /> : <span className="italic text-gray-400 dark:text-gray-500">No reason given</span>}
                            </p>
                        </div>
                    </div>
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
    const paginationRef = useRef(null);
    const [sort, setSort] = useState(filters?.sort ?? 'created_at');
    const [direction, setDirection] = useState(filters?.direction ?? 'desc');

    const applyFilters = () => {
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from, to, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const applyDateRange = (newFrom, newTo) => {
        setFrom(newFrom);
        setTo(newTo);
        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from: newFrom, to: newTo, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setFrom('');
        setTo('');
        setPerPage(DEFAULT_PER_PAGE);
        setSort('created_at');
        setDirection('desc');
        router.get(route('admin.suspension-logs'), {}, { preserveScroll: true });
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
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

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
                        <FiltersMenu
                            activeCount={[status !== 'all', Boolean(from || to)].filter(Boolean).length}
                            onApply={applyFilters}
                            onClear={clearFilters}
                            hasActiveFilters={hasActiveFilters}
                        >
                            <FiltersMenu.Row label="Status">
                                <FilterSelect
                                    value={status}
                                    onChange={setStatus}
                                    className="w-full"
                                    options={[
                                        { value: 'all', label: 'All Statuses' },
                                        { value: 'active', label: 'Currently Suspended' },
                                        { value: 'lifted', label: 'Lifted' },
                                    ]}
                                />
                            </FiltersMenu.Row>
                            <FiltersMenu.Row label="Sort">
                                <FilterSelect
                                    value={`${sort}:${direction}`}
                                    onChange={(v) => {
                                        const [col, dir] = v.split(':');
                                        setSort(col);
                                        setDirection(dir);
                                        router.get(route('admin.suspension-logs'), cleanParams({ search, status, from, to, per_page: perPage, sort: col, direction: dir }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
                                    }}
                                    className="w-full"
                                    options={[
                                        { value: 'created_at:desc', label: 'Newest first' },
                                        { value: 'created_at:asc', label: 'Oldest first' },
                                        { value: 'suspended_until:asc', label: 'Ends soonest' },
                                        { value: 'suspended_until:desc', label: 'Ends latest' },
                                    ]}
                                />
                            </FiltersMenu.Row>
                            <DateRangeFilter from={from} to={to} onApply={applyDateRange} />
                        </FiltersMenu>
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.total} record{logs.total !== 1 ? 's' : ''} match{logs.total === 1 ? 'es' : ''} your filters
                    </p>

                    <div ref={paginationRef} className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={logs} />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
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
                    </div>
                </div>
            </div>

            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}