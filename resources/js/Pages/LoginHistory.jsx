import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import DateRangeFilter from '@/Components/DateRangeFilter';
import { cleanParams } from '@/utils/queryParams';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const actionLabels = {
    logged_in: 'Logged In',
    logged_out: 'Logged Out',
};

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const ICON_PATHS = {
    check: 'M5 13l4 4L19 7',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

const actionIconConfig = {
    logged_in: { path: ICON_PATHS.check, color: 'text-green-500' },
    logged_out: { path: ICON_PATHS.logout, color: 'text-gray-400' },
};

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

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return null;
    if (seconds < 0) seconds = 0; // guards against rows saved before the backend fix
    if (seconds < 60) return 'less than a minute';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours === 0) return `${remMinutes}m`;
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

function LoginHistoryRow({ log }) {
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.check, color: 'text-gray-400' };
    const relative = timeAgo(log.created_at);
    const d = log.details ?? {};

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <div className="flex items-start gap-3 px-6 py-3">
                <span className={`mt-0.5 shrink-0 ${iconConfig.color}`}>
                    <Icon path={iconConfig.path} className="h-4 w-4" />
                </span>
                <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                        {actionLabels[log.action] ?? log.action}
                    </p>
                    {log.action === 'logged_in' && (d.browser || d.device || d.location) && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {[d.location, [d.browser, d.model ? `${d.device} (${d.model})` : d.device, d.os].filter(Boolean).join(' · ')].filter(Boolean).join(' — ')}
                            {d.ip && <span className="text-gray-400 dark:text-gray-500"> ({d.ip})</span>}
                        </p>
                    )}
                    {log.action === 'logged_out' && formatDuration(d.duration_seconds) && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            Session lasted {formatDuration(d.duration_seconds)}
                        </p>
                    )}
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {relative && <span className="text-gray-300 dark:text-gray-600">· {relative}</span>}
                    </p>
                </div>
            </div>
        </li>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { action: 'all', per_page: DEFAULT_PER_PAGE };

export default function LoginHistory({ logs, filters }) {
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);

    const applyFilters = (overrides = {}) => {
        const next = { action, from, to, per_page: perPage, ...overrides };
        router.get(route('activity.login-history'), cleanParams(next, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleActionChange = (v) => { setAction(v); applyFilters({ action: v }); };
    const handlePerPageChange = (v) => { setPerPage(v); applyFilters({ per_page: v }); };
    const handleDateRangeApply = (newFrom, newTo) => { setFrom(newFrom); setTo(newTo); applyFilters({ from: newFrom, to: newTo }); };

    const clearFilters = () => {
        setAction('all');
        setFrom('');
        setTo('');
        setPerPage(DEFAULT_PER_PAGE);
        router.get(route('activity.login-history'));
    };

    const hasActiveFilters = action !== 'all' || from !== '' || to !== '';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('activity.index')} label="Back to Activity Logs" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Login History
                </h2>
            </div>
        }>
            <Head title="Login History" />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <FilterSelect
                            value={action}
                            onChange={handleActionChange}
                            className="w-52"
                            options={[
                                { value: 'all', label: 'All Actions' },
                                ...Object.entries(actionLabels).map(([key, label]) => ({ value: key, label })),
                            ]}
                        />
                        <DateRangeFilter from={from} to={to} onApply={handleDateRangeApply} />
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.total} event{logs.total !== 1 ? 's' : ''}{hasActiveFilters ? ' match your filters' : ' recorded'}
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {logs.data.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {hasActiveFilters ? 'No logins match your filters.' : 'No login activity recorded yet.'}
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
                                    <LoginHistoryRow key={log.id} log={log} />
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={logs} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
