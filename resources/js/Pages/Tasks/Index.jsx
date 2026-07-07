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

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
}

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function ClockIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function AlertIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
}

function CommentIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function EmptyState({ hasAnyTasks, onClearFilters }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            {hasAnyTasks ? (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No tasks match your search</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Try a different name, project, or status filter.</p>
                    <button onClick={onClearFilters} className="mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        Clear filters
                    </button>
                </>
            ) : (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">You don't have any tasks assigned yet</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Tasks assigned to you across all your projects will show up here.</p>
                </>
            )}
        </div>
    );
}

export default function Index({ tasks }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tasks.filter((task) => {
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;
            if (!term) return true;
            return task.title.toLowerCase().includes(term) || task.project?.name?.toLowerCase().includes(term);
        });
    }, [tasks, search, statusFilter]);

    const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all';
    const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Tasks</h2>}>
            <Head title="My Tasks" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by task or project name..."
                                className="w-72 pl-9"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            {Object.entries(statusOptions).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                        {overdueCount > 0 && (
                            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                <AlertIcon className="h-3.5 w-3.5" />
                                {overdueCount} overdue
                            </span>
                        )}
                    </div>

                    {tasks.length > 0 && (
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                            {filtered.length} of {tasks.length} task{tasks.length > 1 ? 's' : ''}
                        </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((task) => {
                            const overdue = isOverdue(task);
                            return (
                                <Link
                                    key={task.id}
                                    href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                    className={`block rounded-lg border-l-4 bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800 ${statusBorders[task.status] ?? 'border-l-gray-400'}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100" title={task.title}>
                                            {task.title}
                                            {task.edited_at && (
                                                <span className="ml-2 text-xs italic text-gray-400 dark:text-gray-500">(edited)</span>
                                            )}
                                        </h3>
                                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs capitalize ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                                    )}
                                    <p className="mt-3 truncate text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500" title={task.project?.name}>
                                        {task.project?.name}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                                        <span className={`flex items-center gap-1 ${overdue ? 'font-medium text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {overdue ? <AlertIcon className="h-3.5 w-3.5 shrink-0" /> : <ClockIcon className="h-3.5 w-3.5 shrink-0" />}
                                            {task.due_date ? `${overdue ? 'Overdue' : 'Due'} ${formatDue(task.due_date)}` : 'No due date'}
                                        </span>
                                        {task.comments_count > 0 && (
                                            <span className="flex shrink-0 items-center gap-1 text-gray-400 dark:text-gray-500">
                                                <CommentIcon className="h-3.5 w-3.5" />
                                                {task.comments_count}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                        {filtered.length === 0 && (
                            <EmptyState hasAnyTasks={tasks.length > 0} onClearFilters={clearFilters} />
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}