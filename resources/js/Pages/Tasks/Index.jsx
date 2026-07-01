import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const statusStyles = {
    todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const statusBorders = {
    todo: 'border-l-gray-400',
    in_progress: 'border-l-blue-500',
    submitted: 'border-l-yellow-500',
    in_review: 'border-l-purple-500',
    done: 'border-l-green-500',
};

const statusOptions = {
    all: 'All',
    todo: 'To Do',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    in_review: 'In Review',
    done: 'Done',
};

function formatDue(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function Index({ tasks }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tasks.filter((task) => {
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;
            if (!term) return true;
            return task.title.toLowerCase().includes(term) || task.project?.name?.toLowerCase().includes(term);
        });
    }, [tasks, search, statusFilter]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Tasks</h2>}>
            <Head title="My Tasks" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by task or project name..."
                            className="w-72"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            {Object.entries(statusOptions).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((task) => (
                            <Link
                                key={task.id}
                                href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                className={`block rounded-lg border-l-4 bg-white p-5 shadow transition hover:shadow-md dark:bg-gray-800 ${statusBorders[task.status] ?? 'border-l-gray-400'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100" title={task.title}>
                                        {task.title}
                                        {task.edited_at && (
                                            <span className="ml-2 text-xs italic text-gray-400 dark:text-gray-500">(edited)</span>
                                        )}
                                    </h3>
                                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {task.description && (
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                                )}
                                <p className="mt-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                    {task.project?.name}
                                </p>
                                <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                    <span>{task.due_date ? `Due ${formatDue(task.due_date)}` : 'No due date'}</span>
                                    {task.comments_count > 0 && (
                                        <span>{task.comments_count} comment{task.comments_count !== 1 ? 's' : ''}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400">
                                {tasks.length === 0 ? "You don't have any tasks assigned yet." : 'No tasks match your search.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}