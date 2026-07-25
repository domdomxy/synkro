import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import Linkify from '@/Components/Linkify';
import DateRangeFilter from '@/Components/DateRangeFilter';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { formatActionLabel, describeLog, ICON_PATHS, actionIconConfig } from '@/utils/activityLog';

const actionLabels = {
    project_created: 'Project Created',
    project_updated: 'Project Updated',
    project_deleted: 'Project Deleted',
    member_added: 'Member Added',
    member_removed: 'Member Removed',
    member_left: 'Member Left',
    role_changed: 'Role Changed',
    ownership_transferred: 'Ownership Transferred',
    task_created: 'Task Created',
    task_updated: 'Task Updated',
    task_assigned: 'Task Assigned',
    task_reassigned: 'Task Reassigned',
    task_unassigned: 'Task Unassigned',
    task_deleted: 'Task Deleted',
    submission_reset: 'Submission Reset',
    submission_kept: 'Submission Kept',
    task_reopened: 'Task Reopened',
    invitation_sent: 'Invitation Sent',
    invitation_accepted: 'Invitation Accepted',
    invitation_denied: 'Invitation Denied',
    comment_added: 'Comment Added',
    comment_edited: 'Comment Edited',
    comment_deleted: 'Comment Deleted',
};

const fieldLabels = {
    title: 'Title',
    description: 'Description',
    due_date: 'Due Date',
    name: 'Project Name',
    priority: 'Priority',
    estimated_hours: 'Estimated Hours',
};

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

function getDetails(log) {
    const d = log.details ?? {};

    if (log.action === 'task_created') {
        return [
            d.task_title && { label: 'Task Name', value: d.task_title },
        ].filter(Boolean);
    }

    if (log.action === 'task_updated' && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: fieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
            isHtml: key === 'description',
        }));
    }

    if (log.action === 'project_updated' && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: fieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
            isHtml: key === 'description',
        }));
    }

    if (log.action === 'task_assigned') {
        return [
            { label: 'Assigned To', value: d.target_name },
            { label: 'Task', value: d.task_title },
        ].filter((r) => r.value);
    }

    if (log.action === 'task_reassigned') {
        return [
            { label: 'Task', value: d.task_title },
            { label: 'From', value: d.old_assignee ?? 'Unassigned' },
            { label: 'To', value: d.new_assignee },
        ].filter((r) => r.value);
    }

    if (log.action === 'role_changed') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Previous Role', value: d.old_role },
            { label: 'New Role', value: d.new_role },
        ].filter((r) => r.value);
    }

    if (log.action === 'member_added') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
        ].filter((r) => r.value);
    }

    if (log.action === 'member_removed' || log.action === 'member_left') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
            { label: 'Reason', value: d.reason },
        ].filter((r) => r.value);
    }

    return [];
}

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

function LogRow({ log }) {
    const [open, setOpen] = useState(false);
    const details = getDetails(log);
    const hasDetails = details.length > 0;
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.dot, color: 'text-gray-400' };
    const relative = timeAgo(log.created_at);

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <button
                onClick={() => hasDetails && setOpen((v) => !v)}
                className={`flex w-full items-start gap-3 px-6 py-3 text-left transition ${hasDetails ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
            >
                <span className={`mt-0.5 shrink-0 ${iconConfig.color}`}>
                    <Icon path={iconConfig.path} className="h-4 w-4" />
                </span>
                <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{describeLog(log)}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {relative && <span className="ml-1.5 text-gray-300 dark:text-gray-600">· {relative}</span>}
                    </p>
                </div>
                {hasDetails && (
                    <svg
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {open && hasDetails && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                    <dl className="space-y-2">
                        {details.map((item, i) => (
                            <div key={i}>
                                {item.isChange ? (
                                    item.isHtml ? (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1.5 space-y-2">
                                                <div className="rounded-md border border-red-100 bg-red-50/50 p-2.5 dark:border-red-900 dark:bg-red-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-red-400 dark:text-red-500">Previous</p>
                                                    <div
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.oldValue && item.oldValue !== '-'
                                                                ? item.oldValue
                                                                : '<span class="italic text-gray-400">Empty</span>',
                                                        }}
                                                    />
                                                </div>
                                                <div className="rounded-md border border-green-100 bg-green-50/50 p-2.5 dark:border-green-900 dark:bg-green-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-green-500 dark:text-green-400">Updated</p>
                                                    <div
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.newValue && item.newValue !== '-'
                                                                ? item.newValue
                                                                : '<span class="italic text-gray-400">Empty</span>',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <span className="rounded bg-red-100 px-2 py-0.5 text-red-700 line-through dark:bg-red-900/40 dark:text-red-400">
                                                    {item.oldValue || '-'}
                                                </span>
                                                <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="rounded bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                                    {item.newValue || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                        <dd className="break-words text-sm text-gray-700 dark:text-gray-300">
                                            {item.label === 'Reason' ? <Linkify text={item.value} /> : item.value}
                                        </dd>
                                    </div>
                                )}
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </li>
    );
}

export default function Logs({ project, logs }) {
    const [userFilter, setUserFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 15;

    const users = useMemo(() => {
        const map = new Map();
        logs.forEach((l) => l.user && map.set(l.user.id, l.user.name));
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [logs]);

    const actions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

    const clearFilters = () => {
        setUserFilter('all');
        setActionFilter('all');
        setFrom('');
        setTo('');
        setPage(1);
    };

    const handleDateRangeApply = (newFrom, newTo) => {
        setFrom(newFrom);
        setTo(newTo);
        setPage(1);
    };

    const filtered = logs.filter((l) => {
        if (userFilter !== 'all' && String(l.user?.id) !== userFilter) return false;
        if (actionFilter !== 'all' && l.action !== actionFilter) return false;
        const logDate = l.created_at?.slice(0, 10);
        if (from && logDate < from) return false;
        if (to && logDate > to) return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const hasActiveFilters = userFilter !== 'all' || actionFilter !== 'all' || from !== '' || to !== '';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('projects.settings', project.id)} label="Back to Settings" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Activity Logs: {project.name}
                </h2>
            </div>
        }>
            <Head title={`Logs - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <FilterSelect
                            value={userFilter}
                            onChange={(v) => { setUserFilter(v); setPage(1); }}
                            className="w-44"
                            options={[{ value: 'all', label: 'All Users' }, ...users.map((u) => ({ value: String(u.id), label: u.name }))]}
                        />
                        <FilterSelect
                            value={actionFilter}
                            onChange={(v) => { setActionFilter(v); setPage(1); }}
                            className="w-52"
                            options={[
                                { value: 'all', label: 'All Actions' },
                                ...actions.map((a) => ({ value: a, label: actionLabels[a] ?? formatActionLabel(a) })),
                            ]}
                        />
                        <DateRangeFilter from={from} to={to} onApply={handleDateRangeApply} />
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                    </div>

                    {logs.length > 0 && (
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                            {filtered.length} of {logs.length} event{logs.length > 1 ? 's' : ''}
                        </p>
                    )}

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {filtered.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {logs.length === 0 ? 'No activity recorded yet.' : 'No activity matches your filters.'}
                                </p>
                                {logs.length > 0 && hasActiveFilters && (
                                    <button onClick={clearFilters} className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul>
                                {paginated.map((log) => (
                                    <LogRow key={log.id} log={log} />
                                ))}
                            </ul>
                        )}
                    </div>

                    {filtered.length > PER_PAGE && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}