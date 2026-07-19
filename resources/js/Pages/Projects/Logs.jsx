import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
};

const fieldLabels = {
    title: 'Title',
    description: 'Description',
    due_date: 'Due Date',
    name: 'Project Name',
};

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const ICON_PATHS = {
    build: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m9-13h.01M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01',
    pencil: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    plus: 'M12 4v16m8-8H4',
    minus: 'M20 12H4',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    swap: 'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4',
    crown: 'M5 8l3 3 4-6 4 6 3-3-2 11H7L5 8z',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    person: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    undo: 'M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4',
    check: 'M5 13l4 4L19 7',
    dot: 'M12 12h.01',
    close_or_x: 'M6 18L18 6M6 6l12 12',
};

const actionIconConfig = {
    project_created: { path: ICON_PATHS.build, color: 'text-green-500' },
    project_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    project_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    member_added: { path: ICON_PATHS.plus, color: 'text-green-500' },
    member_removed: { path: ICON_PATHS.minus, color: 'text-red-500' },
    member_left: { path: ICON_PATHS.logout, color: 'text-amber-500' },
    role_changed: { path: ICON_PATHS.swap, color: 'text-purple-500' },
    ownership_transferred: { path: ICON_PATHS.crown, color: 'text-purple-500' },
    task_created: { path: ICON_PATHS.clipboard, color: 'text-green-500' },
    task_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    task_assigned: { path: ICON_PATHS.person, color: 'text-blue-500' },
    task_reassigned: { path: ICON_PATHS.swap, color: 'text-blue-500' },
    task_unassigned: { path: ICON_PATHS.person, color: 'text-amber-500' },
    task_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    submission_reset: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    submission_kept: { path: ICON_PATHS.check, color: 'text-green-500' },
    task_reopened: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    invitation_denied: { path: ICON_PATHS.close_or_x, color: 'text-red-500' },
};

function describeLog(log) {
    const actor = log.user?.name ?? 'Someone';
    const d = log.details ?? {};
    switch (log.action) {
        case 'project_created': return `${actor} created the project`;
        case 'project_deleted': return `${actor} deleted the project`;
        case 'project_updated': return `${actor} updated the project`;
        case 'member_added': return `${actor} added ${d.target_name} as ${d.role}`;
        case 'member_removed': return `${actor} removed ${d.target_name} (${d.role})`;
        case 'member_left': return `${d.target_name ?? actor} (${d.role}) left the project`;
        case 'role_changed': return `${actor} changed ${d.target_name}'s role from ${d.old_role} to ${d.new_role}`;
        case 'ownership_transferred': return `${actor} transferred ownership to ${d.target_name}`;
        case 'task_created': return `${actor} created task "${d.task_title}"`;
        case 'task_deleted': return `${actor} deleted task "${d.task_title}"`;
        case 'task_assigned': return `${actor} assigned "${d.task_title}" to ${d.target_name}`;
        case 'task_reassigned': return `${actor} reassigned "${d.task_title}" from ${d.old_assignee ?? 'unassigned'} to ${d.new_assignee}`;
        case 'task_unassigned': return `${actor} unassigned "${d.task_title}" (was ${d.old_assignee})`;
        case 'task_updated': return `${actor} updated "${d.task_title}"`;
        case 'submission_reset': return `${actor} reset the submission for "${d.task_title}"`;
        case 'submission_kept': return `${actor} kept the submission for "${d.task_title}"`;
        case 'task_reopened': return `${actor} reopened "${d.task_title}" for changes`;
        case 'invitation_denied': return `${d.target_name} declined the invitation to join`;
        default: return `${actor} performed ${log.action}`;
    }
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

    if (log.action === 'member_removed') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
            { label: 'Reason', value: d.reason },
        ].filter((r) => r.value);
    }

    if (log.action === 'member_left') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
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
                                        <dd className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">{item.value}</dd>
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

    const users = useMemo(() => {
        const map = new Map();
        logs.forEach((l) => l.user && map.set(l.user.id, l.user.name));
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [logs]);

    const actions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

    const clearFilters = () => {
        setUserFilter('all');
        setActionFilter('all');
    };

    const filtered = logs.filter((l) => {
        if (userFilter !== 'all' && String(l.user?.id) !== userFilter) return false;
        if (actionFilter !== 'all' && l.action !== actionFilter) return false;
        return true;
    });

    const hasActiveFilters = userFilter !== 'all' || actionFilter !== 'all';

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
                        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="all">All Users</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="all">All Actions</option>
                            {actions.map((a) => (
                                <option key={a} value={a}>{actionLabels[a] ?? a}</option>
                            ))}
                        </select>
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
                                {filtered.map((log) => (
                                    <LogRow key={log.id} log={log} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}