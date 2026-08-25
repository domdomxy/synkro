import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import ViewToggle from '@/Components/ViewToggle';
import RichTextContent from '@/Components/RichTextContent';
import PerPageSelect from '@/Components/PerPageSelect';
import LocalPagination from '@/Components/LocalPagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Modal from '@/Components/Modal';

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

function ArchiveIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
    );
}

function TaskActionsMenu({ task, pinning, showingArchived, onPin, onUnpin, onArchive, onUnarchive }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 160;

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
        }
        setOpen((v) => !v);
    };

    // Same "flip upward if it'd spill past the bottom of the viewport" logic
    // as ProjectActionsMenu, for rows near the end of the list.
    useLayoutEffect(() => {
        if (!open || !menuRef.current || !btnRef.current) return;
        const menuRect = menuRef.current.getBoundingClientRect();
        const btnRect = btnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - btnRect.bottom;
        if (spaceBelow < menuRect.height + 12 && btnRect.top > menuRect.height + 12) {
            setCoords((prev) => ({ ...prev, top: btnRect.top - menuRect.height - 4 }));
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false);
        };
        const handleScroll = () => setOpen(false);
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                disabled={pinning}
                title="More actions"
                className="rounded-md p-1.5 text-gray-300 opacity-100 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }} className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); task.is_pinned ? onUnpin() : onPin(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        <PinIcon filled={!!task.is_pinned} className="h-4 w-4" />
                        {task.is_pinned ? 'Unpin' : 'Pin to top'}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); showingArchived ? onUnarchive() : onArchive(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        <ArchiveIcon className="h-4 w-4" />
                        {showingArchived ? 'Unarchive' : 'Archive'}
                    </button>
                </div>,
                document.body
            )}
        </>
    );
}

function EmptyState({ hasAnyTasks, showingArchived, onClearFilters }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
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
            ) : showingArchived ? (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No archived tasks</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Tasks you archive will show up here.</p>
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

export default function Index({ tasks, showingArchived, activeCount, archivedCount }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [pinningId, setPinningId] = useState(null);
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return localStorage.getItem('synkro:tasks-view') ?? 'grid';
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const paginationRef = useRef(null);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [skipArchiveConfirm, setSkipArchiveConfirm] = useState(false);

    // Scoped to this page only - "don't show this again" here has no effect
    // on any other confirmation dialog in the app (e.g. project archiving).
    const SKIP_ARCHIVE_CONFIRM_KEY = 'synkro:tasks-archive-skip-confirm';

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

    const switchTab = (archived) => {
        router.get(route('tasks.index'), { archived: archived ? 1 : undefined }, { preserveState: false });
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

    const postArchive = (task) => {
        router.post(route('tasks.archive', task.id), {}, { preserveScroll: true });
    };

    const archiveTask = (task) => {
        let skip = false;
        try { skip = localStorage.getItem(SKIP_ARCHIVE_CONFIRM_KEY) === '1'; } catch { /* private browsing, etc. */ }
        if (skip) {
            postArchive(task);
        } else {
            setArchiveTarget(task);
        }
    };

    const confirmArchiveTask = () => {
        if (skipArchiveConfirm) {
            try { localStorage.setItem(SKIP_ARCHIVE_CONFIRM_KEY, '1'); } catch { /* private browsing, etc. */ }
        }
        postArchive(archiveTarget);
        setArchiveTarget(null);
        setSkipArchiveConfirm(false);
    };

    const cancelArchiveTask = () => {
        setArchiveTarget(null);
        setSkipArchiveConfirm(false);
    };

    const unarchiveTask = (task) => {
        router.post(route('tasks.unarchive', task.id), {}, { preserveScroll: true });
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

    const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Tasks</h2>}>
            <Head title="My Tasks" />
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-8xl px-3 sm:px-6 lg:px-8">
                    <div className="mb-4 inline-flex gap-1 rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-transparent dark:bg-gray-800 sm:mb-6">
                        <button
                            onClick={() => switchTab(false)}
                            className={`rounded-full px-3.5 py-1 text-sm font-medium transition sm:px-5 sm:py-1.5 ${
                                !showingArchived
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Active
                            {typeof activeCount === 'number' && (
                                <span
                                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                        !showingArchived
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    {activeCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => switchTab(true)}
                            className={`rounded-full px-3.5 py-1 text-sm font-medium transition sm:px-5 sm:py-1.5 ${
                                showingArchived
                                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            Archived
                            {typeof archivedCount === 'number' && (
                                <span
                                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                        showingArchived
                                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
                                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    {archivedCount}
                                </span>
                            )}
                        </button>
                    </div>

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
                            <FiltersMenu buttonClassName="shrink-0" activeCount={[statusFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length} onClear={clearFilters}>
                                <FiltersMenu.Row label="Status">
                                    <FilterSelect
                                        value={statusFilter}
                                        onChange={(v) => { setStatusFilter(v); setPage(1); }}
                                        className="w-full"
                                        options={Object.entries(statusOptions).map(([key, label]) => ({ value: key, label }))}
                                    />
                                </FiltersMenu.Row>
                                <FiltersMenu.Row label="Priority">
                                    <FilterSelect
                                        value={priorityFilter}
                                        onChange={(v) => { setPriorityFilter(v); setPage(1); }}
                                        className="w-full"
                                        options={Object.entries(priorityOptions).map(([key, label]) => ({ value: key, label }))}
                                    />
                                </FiltersMenu.Row>
                            </FiltersMenu>
                        </div>

                        {/* Mobile only: the search/filters group above wraps to its
                            own full-width line, so this rule marks it off visually
                            from the overdue badge below instead of the two blurring
                            together. Not needed at sm+, where everything already
                            sits on one row. */}
                        <div className="h-px w-full bg-gray-200 dark:bg-gray-700 sm:hidden" />

                        {overdueCount > 0 && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
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
                                            <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
                                                <TaskActionsMenu
                                                    task={task}
                                                    pinning={pinningId === task.id}
                                                    showingArchived={showingArchived}
                                                    onPin={() => togglePin(task)}
                                                    onUnpin={() => togglePin(task)}
                                                    onArchive={() => archiveTask(task)}
                                                    onUnarchive={() => unarchiveTask(task)}
                                                />
                                            </div>
                                            <Link
                                                href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 pr-10 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:grid-cols-[14rem_minmax(0,1fr)_14rem_7rem_10rem_2.5rem] sm:items-center sm:gap-4"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100" title={task.title}>
                                                            {task.title}
                                                        </span>
                                                        {!!task.is_pinned && (
                                                            <PinIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                        )}
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
                                    <div className="absolute right-3 top-3 z-10">
                                        <TaskActionsMenu
                                            task={task}
                                            pinning={pinningId === task.id}
                                            showingArchived={showingArchived}
                                            onPin={() => togglePin(task)}
                                            onUnpin={() => togglePin(task)}
                                            onArchive={() => archiveTask(task)}
                                            onUnarchive={() => unarchiveTask(task)}
                                        />
                                    </div>
                                    <Link
                                        href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-start justify-between gap-2 pr-6">
                                            <h3 className="min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100" title={task.title}>
                                                {task.title}
                                                {!!task.is_pinned && (
                                                    <PinIcon filled className="ml-2 inline-block h-3.5 w-3.5 shrink-0 align-middle text-amber-500" />
                                                )}
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
                            <EmptyState hasAnyTasks={tasks.length > 0} showingArchived={showingArchived} onClearFilters={clearFilters} />
                        </div>
                    )}
                </div>
            </div>
            <Modal show={!!archiveTarget} onClose={cancelArchiveTask} maxWidth="sm" overlayClassName="bg-black/55 dark:bg-black/70">
                <div className="p-5">
                    <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-gray-900 dark:text-gray-100">
                        Archive "{archiveTarget?.title}"?
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                        This only affects your own "My Tasks" list; the task itself is unchanged for everyone else.
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        You can unarchive it anytime.
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={skipArchiveConfirm}
                                onChange={(e) => setSkipArchiveConfirm(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            />
                            Don't show this again
                        </label>
                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={cancelArchiveTask}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmArchiveTask}
                                autoFocus
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}