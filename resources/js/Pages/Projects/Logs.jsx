import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import DateRangeFilter from '@/Components/DateRangeFilter';
import LogEntryRow from '@/Components/LogEntryRow';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { formatActionLabel } from '@/utils/activityLog';

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
                                    <LogEntryRow key={log.id} log={log} />
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