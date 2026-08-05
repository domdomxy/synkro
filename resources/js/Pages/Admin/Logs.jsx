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
import { noteBoldSegments } from '@/utils/noteFormat';
import { cleanParams } from '@/utils/queryParams';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return null;
}

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const ICON_PATHS = {
    minus: 'M20 12H4',
    check: 'M5 13l4 4L19 7',
    swap: 'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM8 11V7a4 4 0 118 0v4',
    pencil: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    close_or_x: 'M6 18L18 6M6 6l12 12',
    eye: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    dot: 'M12 12h.01',
};

const actionIconConfig = {
    'user.suspended': { path: ICON_PATHS.minus, color: 'text-red-500' },
    'user.suspension_lifted': { path: ICON_PATHS.check, color: 'text-green-500' },
    'user.role_changed': { path: ICON_PATHS.swap, color: 'text-purple-500' },
    'user.info_updated': { path: ICON_PATHS.pencil, color: 'text-amber-500' },
    'user.deleted': { path: ICON_PATHS.close_or_x, color: 'text-rose-500' },
    'user.deleted_permanent': { path: ICON_PATHS.close_or_x, color: 'text-orange-600' },
    'user.password_reset': { path: ICON_PATHS.lock, color: 'text-amber-500' },
    'user.logs_viewed': { path: ICON_PATHS.eye, color: 'text-sky-500' },
    'user.login_history_viewed': { path: ICON_PATHS.eye, color: 'text-sky-500' },
    'appeal.reviewed': { path: ICON_PATHS.check, color: 'text-teal-500' },
    'appeal.dismissed': { path: ICON_PATHS.close_or_x, color: 'text-gray-400' },
    'appeal.responded': { path: ICON_PATHS.pencil, color: 'text-indigo-500' },
    'appeal.auto_closed': { path: ICON_PATHS.clock, color: 'text-gray-400' },
    'ticket.status_changed': { path: ICON_PATHS.swap, color: 'text-blue-500' },
    'ticket.responded': { path: ICON_PATHS.pencil, color: 'text-indigo-500' },
    'ticket.auto_closed': { path: ICON_PATHS.clock, color: 'text-gray-400' },
    'category.created': { path: ICON_PATHS.check, color: 'text-teal-500' },
    'category.updated': { path: ICON_PATHS.pencil, color: 'text-amber-500' },
    'category.deleted': { path: ICON_PATHS.close_or_x, color: 'text-red-500' },
};

const actionColors = {
    'user.suspended': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    'user.suspension_lifted': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'user.role_changed': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    'user.info_updated': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'user.deleted': 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    'user.deleted_permanent': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    'user.password_reset': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'user.logs_viewed': 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    'user.login_history_viewed': 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    'appeal.reviewed': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    'appeal.dismissed': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'appeal.responded': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    'appeal.auto_closed': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    'ticket.status_changed': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'ticket.responded': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    'ticket.auto_closed': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    'category.created': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    'category.updated': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'category.deleted': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// AdminLog.admin_id is null for both "the admin who did this was later deleted"
// and "nothing did this, a scheduled job did" — these two are indistinguishable
// from the foreign key alone, so we disambiguate by action: only the actions a
// human never performs (both currently: the 24h-inactivity auto-close jobs)
// get the "automated" label instead of "Deleted admin".
const AUTOMATED_ACTIONS = new Set(['ticket.auto_closed', 'appeal.auto_closed']);

function AdminLogRow({ log, actionCatalog }) {
    const [open, setOpen] = useState(false);
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.dot, color: 'text-gray-400' };
    const description = log.description ?? '';
    const reason = log.reason ?? '';
    const hasReason = reason.trim().length > 0;
    const relative = timeAgo(log.created_at);

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <button
                onClick={() => hasReason && setOpen((v) => !v)}
                className={`flex w-full items-start gap-3 px-6 py-3 text-left transition ${hasReason ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
            >
                <span className="relative mt-0.5 h-8 w-8 shrink-0">
                    <Avatar user={log.admin} size="h-8 w-8" rounded="rounded-full" />
                    <span
                        className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800 ${iconConfig.color}`}
                    >
                        <Icon path={iconConfig.path} className="h-3 w-3" />
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {log.admin?.name ?? (AUTOMATED_ACTIONS.has(log.action) ? 'Synkro (automated)' : 'Deleted admin')}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${actionColors[log.action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {actionCatalog[log.action] ?? log.action}
                        </span>
                    </div>
                    {description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {noteBoldSegments(description, 'font-bold text-gray-800 dark:text-gray-200')}
                        </p>
                    )}
                    {hasReason && open && (
                        <div className="mt-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                Reason Given
                            </p>
                            <div className="mt-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 p-2.5 dark:border-indigo-900 dark:bg-indigo-950/20">
                                <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                                    <Linkify text={reason} />
                                </p>
                            </div>
                        </div>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span>
                            {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {relative && <span className="ml-1.5">· {relative}</span>}
                    </p>
                </div>
                {hasReason && (
                    <svg
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>
        </li>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { action: 'all', per_page: DEFAULT_PER_PAGE };

export default function Logs({ logs, actionCatalog, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const paginationRef = useRef(null);

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

    const applyDateRange = (newFrom, newTo) => {
        setFrom(newFrom);
        setTo(newTo);
        router.get(route('admin.logs'), cleanParams({ search, action, from: newFrom, to: newTo, per_page: perPage }, FILTER_DEFAULTS), { preserveState: true });
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
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

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
                        <FiltersMenu
                            activeCount={[action !== 'all', Boolean(from || to)].filter(Boolean).length}
                            onApply={applyFilters}
                            onClear={clearFilters}
                            hasActiveFilters={hasActiveFilters}
                        >
                            <FiltersMenu.Row label="Action">
                                <FilterSelect
                                    value={action}
                                    onChange={setAction}
                                    className="w-full"
                                    options={[
                                        { value: 'all', label: 'All Actions' },
                                        ...Object.entries(actionCatalog).map(([key, label]) => ({ value: key, label })),
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
                                    {hasActiveFilters ? 'No administration activity matches your filters.' : 'No administration activity recorded yet.'}
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
                                    <AdminLogRow key={log.id} log={log} actionCatalog={actionCatalog} />
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
