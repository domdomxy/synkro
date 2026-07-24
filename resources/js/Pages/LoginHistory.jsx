import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import DateRangeFilter from '@/Components/DateRangeFilter';
import Modal from '@/Components/Modal';
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
    desktop: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z',
    mobile: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
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

function LoginHistoryRow({ log, onSelect }) {
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.check, color: 'text-gray-400' };
    const relative = timeAgo(log.created_at);
    const d = log.details ?? {};
    const hasDeviceInfo = log.action === 'logged_in' && (d.browser || d.device || d.os || d.location || d.ip);

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <div
                role={hasDeviceInfo ? 'button' : undefined}
                tabIndex={hasDeviceInfo ? 0 : undefined}
                onClick={hasDeviceInfo ? () => onSelect(log) : undefined}
                onKeyDown={hasDeviceInfo ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect(log) : undefined}
                className={`flex items-start gap-3 px-6 py-3 ${hasDeviceInfo ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40' : ''}`}
            >
                <span className={`mt-0.5 shrink-0 ${iconConfig.color}`}>
                    <Icon path={iconConfig.path} className="h-4 w-4" />
                </span>
                <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                        {actionLabels[log.action] ?? log.action}
                    </p>
                    {hasDeviceInfo && (
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
                {hasDeviceInfo && (
                    <Icon path="M9 5l7 7-7 7" className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
                )}
            </div>
        </li>
    );
}

function DetailRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                <Icon path={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
                <p className="mt-0.5 truncate text-sm text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    );
}

function LoginDetailsModal({ log, onClose }) {
    const d = log?.details ?? {};
    const isMobileDevice = d.device === 'Mobile' || d.device === 'Tablet';
    const deviceValue = [d.model ? `${d.device} (${d.model})` : d.device, d.os].filter(Boolean).join(' · ');

    return (
        <Modal show={!!log} onClose={onClose} maxWidth="sm">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sign-in details</h3>
                {log && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                )}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <DetailRow
                    icon={isMobileDevice ? ICON_PATHS.mobile : ICON_PATHS.desktop}
                    label="Device"
                    value={deviceValue}
                />
                <DetailRow icon="M12 6v6l4 2" label="Browser" value={d.browser} />
                <DetailRow icon={ICON_PATHS.location} label="Location" value={d.location} />
                <DetailRow icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" label="IP address" value={d.ip} />
            </div>
            <div className="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { action: 'all', per_page: DEFAULT_PER_PAGE };

export default function LoginHistory({ logs, filters }) {
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const [selectedLog, setSelectedLog] = useState(null);

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
                                    <LoginHistoryRow key={log.id} log={log} onSelect={setSelectedLog} />
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

            <LoginDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </AuthenticatedLayout>
    );
}
