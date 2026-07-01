import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
};

const fieldLabels = { title: 'title', description: 'description', due_date: 'due date' };

function describeLog(log) {
    const actor = log.user?.name ?? 'Someone';
    const d = log.details ?? {};

    switch (log.action) {
        case 'project_created':
            return `${actor} created the project`;
        case 'project_deleted':
            return `${actor} deleted the project`;
        case 'project_updated': {
            const fields = Object.entries(d.changes ?? {}).map(([key, val]) =>
                `${fieldLabels[key] ?? key} from "${val.old}" to "${val.new}"`
            );
            return `${actor} changed the project ${fields.join(', ')}`;
        }
        case 'member_added':
            return `${actor} added ${d.target_name} as ${d.role}`;
        case 'member_removed':
            return `${actor} removed ${d.target_name} (${d.role}) from the project`;
        case 'member_left':
            return `${d.target_name} (${d.role}) left the project`;
        case 'role_changed':
            return `${actor} changed ${d.target_name}'s role from ${d.old_role} to ${d.new_role}`;
        case 'ownership_transferred':
            return `${actor} transferred ownership to ${d.target_name}`;
        case 'task_created':
            return `${actor} created task "${d.task_title}"`;
        case 'task_deleted':
            return `${actor} deleted task "${d.task_title}"`;
        case 'task_assigned':
            return `${actor} assigned "${d.task_title}" to ${d.target_name}`;
        case 'task_reassigned':
            return `${actor} reassigned "${d.task_title}" from ${d.old_assignee ?? 'unassigned'} to ${d.new_assignee}`;
        case 'task_unassigned':
            return `${actor} unassigned "${d.task_title}" (was ${d.old_assignee})`;
        case 'task_updated': {
            const fields = Object.entries(d.changes ?? {}).map(([key, val]) =>
                `${fieldLabels[key] ?? key} from "${val.old ?? '—'}" to "${val.new ?? '—'}"`
            );
            return `${actor} changed "${d.task_title}" ${fields.join(', ')}`;
        }
        case 'submission_reset':
            return `${actor} reset the submission for "${d.task_title}"`;
        case 'submission_kept':
            return `${actor} kept the submission for "${d.task_title}"`;
        default:
            return `${actor} performed ${log.action}`;
    }
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

    const filtered = logs.filter((l) => {
        if (userFilter !== 'all' && String(l.user?.id) !== userFilter) return false;
        if (actionFilter !== 'all' && l.action !== actionFilter) return false;
        return true;
    });

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Activity Logs — {project.name}</h2>}>
            <Head title={`Logs - ${project.name}`} />
            <div className="py-12">
               <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex flex-wrap gap-4">
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
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <ul className="divide-y dark:divide-gray-700">
                            {filtered.map((log) => (
                                <li key={log.id} className="px-6 py-3">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{describeLog(log)}</p>
                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </li>
                            ))}
                            {filtered.length === 0 && (
                                <li className="px-6 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No matching activity.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}