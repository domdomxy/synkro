import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import DateRangeFilter from '@/Components/DateRangeFilter';
import LogEntryRow from '@/Components/LogEntryRow';
import PerPageSelect from '@/Components/PerPageSelect';
import LocalPagination from '@/Components/LocalPagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import { Head } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
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
    checklist_item_updated: 'Checklist Item Edited',
    checklist_item_deleted: 'Checklist Item Removed',
    invitation_sent: 'Invitation Sent',
    invitation_accepted: 'Invitation Accepted',
    invitation_denied: 'Invitation Denied',
    comment_added: 'Comment Added',
    comment_edited: 'Comment Edited',
    comment_deleted: 'Comment Deleted',
};

export default function Logs({ project, logs, backHref, backLabel }) {
    const [userFilter, setUserFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const paginationRef = useRef(null);

    const handlePerPageChange = (value) => {
        setPerPage(value);
        setPage(1);
    };

    const users = useMemo(() => {
        const map = new Map();
        logs.forEach((l) => l.user && map.set(l.user.id, l.user));
        return Array.from(map.values());
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

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const hasActiveFilters = userFilter !== 'all' || actionFilter !== 'all' || from !== '' || to !== '';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={backHref ?? route('projects.settings', project.id)} label={backLabel ?? 'Back to Settings'} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Activity Logs: {project.name}
                </h2>
            </div>
        }>
            <Head title={`Logs - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <FiltersMenu
                            activeCount={[userFilter !== 'all', actionFilter !== 'all', Boolean(from || to)].filter(Boolean).length}
                            onClear={clearFilters}
                        >
                            <FiltersMenu.Row label="User">
                                <FilterSelect
                                    value={userFilter}
                                    onChange={(v) => { setUserFilter(v); setPage(1); }}
                                    className="w-full"
                                    options={[{ value: 'all', label: 'All Users' }, ...users.map((u) => ({ value: String(u.id), label: u.name, avatar: u }))]}
                                />
                            </FiltersMenu.Row>
                            <FiltersMenu.Row label="Action">
                                <FilterSelect
                                    value={actionFilter}
                                    onChange={(v) => { setActionFilter(v); setPage(1); }}
                                    className="w-full"
                                    options={[
                                        { value: 'all', label: 'All Actions' },
                                        ...actions.map((a) => ({ value: a, label: actionLabels[a] ?? formatActionLabel(a) })),
                                    ]}
                                />
                            </FiltersMenu.Row>
                            <DateRangeFilter from={from} to={to} onApply={handleDateRangeApply} />
                        </FiltersMenu>
                    </div>

                    {logs.length > 0 && (
                        <p className="mb-2 text-sm text-gray-400 dark:text-gray-500">
                            {filtered.length} of {logs.length} event{logs.length > 1 ? 's' : ''}
                        </p>
                    )}

                    {filtered.length > 0 && (
                        <div ref={paginationRef} className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                            <LocalPagination
                                page={currentPage}
                                totalPages={totalPages}
                                total={filtered.length}
                                perPage={perPage}
                                onPageChange={setPage}
                            />
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
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

                </div>
            </div>

            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}