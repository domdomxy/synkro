import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import FilterSelect from '@/Components/FilterSelect';
import ViewToggle from '@/Components/ViewToggle';
import RichTextContent from '@/Components/RichTextContent';
import PerPageSelect from '@/Components/PerPageSelect';
import LocalPagination from '@/Components/LocalPagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';

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

const priorityStyles = {
    low: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const priorityOptions = {
    all: 'All Priorities',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

function formatDue(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
}

/** Rich-text descriptions are stored as HTML; strip tags for a plain-text list preview. */
function descriptionPreview(html) {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
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

function PinIcon({ filled, className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [pinningId, setPinningId] = useState(null);
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return localStorage.getItem('synkro:tasks-view') ?? 'grid';
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const paginationRef = useRef(null);

    const changeView = (next) => {
        setView(next);
        try { localStorage.setItem('synkro:tasks-view', next); } catch { /* private browsing, etc. */ }
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        setPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setPage(1);
    };

    const togglePin = (task) => {
        setPinningId(task.id);
        const routeName = task.is_pinned ? 'tasks.unpin' : 'tasks.pin';
        router.post(route(routeName, task.id), {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setPinningId(null),
        });
    };

    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tasks
            .filter((task) => {
                if (statusFilter !== 'all' && task.status !== statusFilter) return false;
                if (priorityFilter !== 'all' && (task.priority ?? 'medium') !== priorityFilter) return false;
                if (!term) return true;
                return task.title.toLowerCase().includes(term) || task.project?.name?.toLowerCase().includes(term);
            })
            .sort((a, b) => {
                const pinDiff = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
                if (pinDiff !== 0) return pinDiff;
                return (PRIORITY_ORDER[a.priority ?? 'medium'] ?? 1) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 1);
            });
    }, [tasks, search, statusFilter, priorityFilter]);

    const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all';
    const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Tasks</h2>}>
            <Head title="My Tasks" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search by task or project name..."
                                className="w-full pl-9 sm:w-72"
                            />
                        </div>
                        <FilterSelect
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setPage(1); }}
                            className="w-44"
                            options={Object.entries(statusOptions).map(([key, label]) => ({ value: key, label }))}
                        />
                        <FilterSelect
                            value={priorityFilter}
                            onChange={(v) => { setPriorityFilter(v); setPage(1); }}
                            className="w-44"
                            options={Object.entries(priorityOptions).map(([key, label]) => ({ value: key, label }))}
                        />
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
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {filtered.length} of {tasks.length} task{tasks.length > 1 ? 's' : ''}
                            </p>
                            <ViewToggle value={view} onChange={changeView} />
                        </div>
                    )}

                    {view === 'list' && filtered.length > 0 && (
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

                    {view === 'list' && filtered.length > 0 && (
                        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                            <div className="hidden border-b border-gray-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:grid sm:grid-cols-[14rem_minmax(0,1fr)_14rem_7rem_10rem_2.5rem] sm:items-center sm:gap-4">
                                <span>Task</span>
                                <span>Description</span>
                                <span>Project</span>
                                <span>Status</span>
                                <span>Due</span>
                                <span></span>
                            </div>
                            <ul>
                                {paginated.map((task) => {
                                    const overdue = isOverdue(task);
                                    return (
                                        <li key={task.id} className="group relative border-b border-gray-100 last:border-0 dark:border-gray-700">
                                            <button
                                                onClick={() => togglePin(task)}
                                                disabled={pinningId === task.id}
                                                title={task.is_pinned ? 'Unpin' : 'Pin to top'}
                                                className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 transition disabled:opacity-50 ${
                                                    task.is_pinned
                                                        ? 'text-amber-500 opacity-100'
                                                        : 'text-gray-300 opacity-100 hover:bg-gray-100 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                <PinIcon filled={!!task.is_pinned} className="h-3.5 w-3.5" />
                                            </button>
                                            <Link
                                                href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 pr-10 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:grid-cols-[14rem_minmax(0,1fr)_14rem_7rem_10rem_2.5rem] sm:items-center sm:gap-4"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100" title={task.title}>
                                                            {task.title}
                                                        </span>
                                                        {task.priority && task.priority !== 'medium' && (
                                                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[task.priority] ?? priorityStyles.medium}`}>
                                                                {task.priority === 'high' ? 'High' : 'Low'}
                                                            </span>
                                                        )}
                                                        {task.comments_count > 0 && (
                                                            <span className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-gray-500 sm:flex">
                                                                <CommentIcon className="h-3.5 w-3.5" />
                                                                {task.comments_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500 sm:hidden">
                                                        {task.project?.name} · {task.due_date ? `${overdue ? 'Overdue' : 'Due'} ${formatDue(task.due_date)}` : 'No due date'}
                                                    </p>
                                                </div>
                                                <span className="hidden truncate text-sm text-gray-500 dark:text-gray-400 sm:block">
                                                    {task.description
                                                        ? descriptionPreview(task.description)
                                                        : <span className="italic text-gray-300 dark:text-gray-600">No description</span>}
                                                </span>
                                                <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:line-clamp-2 sm:block" title={task.project?.name}>
                                                    {task.project?.name}
                                                </span>
                                                <span className={`hidden w-fit shrink-0 rounded-full px-2 py-1 text-xs capitalize sm:block ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                <span className={`hidden items-center gap-1 text-xs sm:flex ${overdue ? 'font-medium text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    {overdue ? <AlertIcon className="h-3.5 w-3.5 shrink-0" /> : <ClockIcon className="h-3.5 w-3.5 shrink-0" />}
                                                    {task.due_date ? formatDue(task.due_date) : 'No due date'}
                                                </span>
                                                <span className="hidden sm:block" />
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {view === 'grid' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((task) => {
                            const overdue = isOverdue(task);
                            return (
                                <div
                                    key={task.id}
                                    className={`group relative rounded-lg border-l-4 bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800 ${statusBorders[task.status] ?? 'border-l-gray-400'}`}
                                >
                                    <button
                                        onClick={() => togglePin(task)}
                                        disabled={pinningId === task.id}
                                        title={task.is_pinned ? 'Unpin' : 'Pin to top'}
                                        className={`absolute right-3 top-3 z-10 rounded-md p-1.5 transition disabled:opacity-50 ${
                                            task.is_pinned
                                                ? 'text-amber-500 opacity-100'
                                                : 'text-gray-300 opacity-100 hover:bg-gray-100 hover:text-gray-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <PinIcon filled={!!task.is_pinned} className="h-3.5 w-3.5" />
                                    </button>
                                    <Link
                                        href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-start justify-between gap-2 pr-6">
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
                                        {task.priority && task.priority !== 'medium' && (
                                            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority] ?? priorityStyles.medium}`}>
                                                {task.priority === 'high' ? 'High Priority' : 'Low Priority'}
                                            </span>
                                        )}
                                        {task.description && (
                                            <RichTextContent
                                                className="prose-sm mt-2 line-clamp-2 max-w-none whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400"
                                                style={{ tabSize: 4 }}
                                                html={task.description}
                                            />
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
                                </div>
                            );
                        })}
                    </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="grid">
                            <EmptyState hasAnyTasks={tasks.length > 0} onClearFilters={clearFilters} />
                        </div>
                    )}
                </div>
            </div>
            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}