import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import ViewToggle from '@/Components/ViewToggle';
import PerPageSelect from '@/Components/PerPageSelect';
import LocalPagination from '@/Components/LocalPagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import RichTextContent from '@/Components/RichTextContent';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';

const statusStyles = {
    submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

const statusBorders = {
    submitted: 'border-l-yellow-500',
    in_review: 'border-l-purple-500',
};

const statusOptions = {
    all: 'All',
    submitted: 'Awaiting Review',
    in_review: 'In Review',
};

function formatWait(dateString) {
    if (!dateString) return null;
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

// "submitted" tasks are waiting on submitted_at (time since the assignee handed it
// off); "in_review" tasks are waiting on review_started_at (time since the current
// reviewer picked it up) - these are two different clocks, not one continuous wait.
function waitTimestamp(task) {
    return task.status === 'in_review' ? task.review_started_at : task.submitted_at;
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

function CommentIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function FileIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    );
}

function EmptyState({ hasAnyTasks, onClearFilters }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nothing waiting on you</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                        Work submitted for review, in any project where you're an owner, manager, or tester, will show up here.
                    </p>
                </>
            )}
        </div>
    );
}

export default function Index({ tasks }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return localStorage.getItem('synkro:testing-view') ?? 'grid';
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const paginationRef = useRef(null);

    const changeView = (next) => {
        setView(next);
        try { localStorage.setItem('synkro:testing-view', next); } catch { /* private browsing, etc. */ }
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        setPage(1);
    };

    const projectOptions = useMemo(() => {
        const seen = new Map();
        tasks.forEach((t) => { if (t.project) seen.set(t.project.id, t.project.name); });
        return [{ value: 'all', label: 'All Projects' }, ...Array.from(seen, ([value, label]) => ({ value: String(value), label }))];
    }, [tasks]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setProjectFilter('all');
        setPage(1);
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tasks
            .filter((task) => {
                if (statusFilter !== 'all' && task.status !== statusFilter) return false;
                if (projectFilter !== 'all' && String(task.project_id) !== projectFilter) return false;
                if (!term) return true;
                return task.title.toLowerCase().includes(term) || task.project?.name?.toLowerCase().includes(term);
            });
    }, [tasks, search, statusFilter, projectFilter]);

    const inReviewCount = useMemo(() => tasks.filter((t) => t.status === 'in_review').length, [tasks]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Testing Queue</h2>}>
            <Head title="Testing Queue" />
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-8xl px-3 sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <div className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
                                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                    <SearchIcon />
                                </div>
                                <TextInput
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search by task or project name..."
                                    className="w-full pl-9"
                                />
                            </div>
                            <FiltersMenu buttonClassName="shrink-0" activeCount={[statusFilter !== 'all', projectFilter !== 'all'].filter(Boolean).length} onClear={clearFilters}>
                                <FiltersMenu.Row label="Status">
                                    <FilterSelect
                                        value={statusFilter}
                                        onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                        className="w-full"
                                        options={Object.entries(statusOptions).map(([key, label]) => ({ value: key, label }))}
                                    />
                                </FiltersMenu.Row>
                                <FiltersMenu.Row label="Project">
                                    <FilterSelect
                                        value={projectFilter}
                                        onChange={(v) => { setProjectFilter(v); setPage(1); }}
                                        className="w-full"
                                        options={projectOptions}
                                    />
                                </FiltersMenu.Row>
                            </FiltersMenu>
                        </div>

                        {/* Mobile only: the search/filters group above wraps to its
                            own full-width line, so this rule marks it off visually
                            from the in-review badge below instead of the two blurring
                            together. Not needed at sm+, where everything already sits
                            on one row. */}
                        <div className="h-px w-full bg-gray-200 dark:bg-gray-700 sm:hidden" />

                        {inReviewCount > 0 && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                                {inReviewCount} in review
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
                        <div ref={paginationRef} className="mb-4 flex flex-col gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 shadow sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3 dark:border-gray-700 dark:bg-gray-800">
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
                            <div className="hidden border-b border-gray-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:grid sm:grid-cols-[14rem_minmax(0,1fr)_14rem_8rem_10rem_8rem] sm:items-center sm:gap-4">
                                <span>Task</span>
                                <span>Description</span>
                                <span>Project</span>
                                <span>Status</span>
                                <span>Assignee</span>
                                <span>Waiting</span>
                            </div>
                            <ul>
                                {paginated.map((task) => (
                                    <li key={task.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                                        <Link
                                            href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                            className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:grid-cols-[14rem_minmax(0,1fr)_14rem_8rem_10rem_8rem] sm:items-center sm:gap-4"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100" title={task.title}>
                                                        {task.title}
                                                    </span>
                                                    {task.comments_count > 0 && (
                                                        <span className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-gray-500 sm:flex">
                                                            <CommentIcon className="h-3.5 w-3.5" />
                                                            {task.comments_count}
                                                        </span>
                                                    )}
                                                    {task.deliverables_count > 0 && (
                                                        <span className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-gray-500 sm:flex">
                                                            <FileIcon className="h-3.5 w-3.5" />
                                                            {task.deliverables_count}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500 sm:hidden">
                                                    {task.project?.name} · {waitTimestamp(task) ? `Waiting ${formatWait(waitTimestamp(task))}` : ''}
                                                </p>
                                            </div>
                                            <RichTextContent
                                                as="span"
                                                className="hidden truncate text-sm text-gray-500 dark:text-gray-400 sm:block [&_*]:inline"
                                                html={task.description}
                                                fallback='<span class="italic text-gray-300 dark:text-gray-600">No description</span>'
                                            />
                                            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:line-clamp-2 sm:block" title={task.project?.name}>
                                                {task.project?.name}
                                            </span>
                                            <span className={`hidden w-fit shrink-0 rounded-full px-2 py-1 text-xs font-medium sm:block ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {task.status === 'in_review' ? 'In Review' : 'Awaiting Review'}
                                            </span>
                                            <span className="hidden min-w-0 items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 sm:flex">
                                                {task.assignee ? (
                                                    <>
                                                        <Avatar user={task.assignee} size="h-5 w-5" />
                                                        <span className="truncate">{task.assignee.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="italic text-gray-400 dark:text-gray-500">Unassigned</span>
                                                )}
                                            </span>
                                            <span className="hidden items-center gap-1 text-xs text-gray-400 dark:text-gray-500 sm:flex">
                                                {waitTimestamp(task) && (
                                                    <>
                                                        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                                                        {formatWait(waitTimestamp(task))}
                                                    </>
                                                )}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {view === 'grid' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((task) => (
                            <Link
                                key={task.id}
                                href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                className={`group block rounded-lg border-l-4 bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800 ${statusBorders[task.status] ?? 'border-l-gray-400'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100" title={task.title}>
                                        {task.title}
                                    </h3>
                                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {task.status === 'in_review' ? 'In Review' : 'Awaiting Review'}
                                    </span>
                                </div>
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
                                    <div className="flex min-w-0 items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                        {task.assignee ? (
                                            <>
                                                <Avatar user={task.assignee} size="h-6 w-6" className="shrink-0" />
                                                <span className="truncate">{task.assignee.name}</span>
                                            </>
                                        ) : (
                                            <span className="italic text-gray-400 dark:text-gray-500">Unassigned</span>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2 text-gray-400 dark:text-gray-500">
                                        {task.deliverables_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FileIcon className="h-3.5 w-3.5" />
                                                {task.deliverables_count}
                                            </span>
                                        )}
                                        {task.comments_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <CommentIcon className="h-3.5 w-3.5" />
                                                {task.comments_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {waitTimestamp(task) && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                                        Waiting {formatWait(waitTimestamp(task))}
                                    </div>
                                )}
                            </Link>
                        ))}
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
