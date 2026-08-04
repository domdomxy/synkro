import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useConfirm from '@/hooks/useConfirm';
import Checkbox from '@/Components/Checkbox';
import TextInput from '@/Components/TextInput';
import FiltersMenu from '@/Components/FiltersMenu';
import FilterSelect from '@/Components/FilterSelect';
import DateRangeFilter from '@/Components/DateRangeFilter';
import BackButton from '@/Components/BackButton';

function TrashIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function UndoIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function ProjectItemIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function TaskItemIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function SearchInput({ value, onChange, placeholder, className = '' }) {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <SearchIcon />
            </div>
            <TextInput value={value} onChange={onChange} placeholder={placeholder} className={`pl-9 ${className}`} />
        </div>
    );
}

const TYPE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'projects', label: 'Projects only' },
    { value: 'tasks', label: 'Tasks only' },
];

const URGENCY_OPTIONS = [
    { value: 'all', label: 'Any time left' },
    { value: 'soon', label: 'Purging within 3 days' },
    { value: 'today', label: 'Purging today' },
];

/** How many days remain before an item is purged for good, floored at 0 for anything already due. */
function daysLeft(graceEndsAt) {
    if (!graceEndsAt) return null;
    const ms = new Date(graceEndsAt) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function formatDeletedAt(deletedAt) {
    if (!deletedAt) return null;
    return new Date(deletedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Compact form used on narrow screens where the full "medium" date + time
// (e.g. "Aug 3, 2026, 10:19 PM") is too wide to sit next to the subtitle and
// grace badge without wrapping the row onto a second line.
function formatDeletedAtShort(deletedAt) {
    if (!deletedAt) return null;
    return new Date(deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function GraceBadge({ graceEndsAt }) {
    const days = daysLeft(graceEndsAt);
    if (days === null) return null;

    const urgent = days <= 1;
    const soon = days > 1 && days <= 3;

    return (
        <span
            className={
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ' +
                (urgent
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                    : soon
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500')
            }
        >
            {days === 0 ? 'Purges today' : days === 1 ? 'Purges in 1 day' : `Purges in ${days} days`}
        </span>
    );
}

function KebabIcon() {
    return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}

const ROW_MENU_WIDTH = 176; // matches w-44

// Same portal-into-body + fixed-position + upward-flip treatment as
// TaskRow's KebabMenu and Resources' row menu - a plain absolutely-positioned
// dropdown gets clipped by this list's own overflow-hidden rounded corners,
// and would run off the bottom of the screen for the last few rows in a
// long trash list.
function RowActionsMenu({ onRestore, onDelete }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const ref = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (
                ref.current && !ref.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    useLayoutEffect(() => {
        if (!open || !ref.current) return;
        const buttonRect = ref.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight ?? 0;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const openUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;
        const left = Math.min(
            Math.max(buttonRect.right - ROW_MENU_WIDTH, 8),
            window.innerWidth - ROW_MENU_WIDTH - 8
        );
        const top = openUpward ? buttonRect.top - menuHeight - 4 : buttonRect.bottom + 4;
        setPosition({ top, left });
    }, [open]);

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Actions"
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                <KebabIcon />
            </button>
            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, width: ROW_MENU_WIDTH }}
                    className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    <button
                        onClick={() => { setOpen(false); onRestore(); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <UndoIcon />
                        Restore
                    </button>
                    <button
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete forever
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}

function TrashRow({ icon, title, titleHref, subtitle, deletedAt, graceEndsAt, selected, onToggleSelect, onRestore, onDelete }) {
    const deletedLabel = formatDeletedAt(deletedAt);
    const deletedLabelShort = formatDeletedAtShort(deletedAt);
    return (
        // flex-nowrap (not flex-wrap) is the fix for the row dropping the
        // kebab menu onto its own line on narrow/mobile widths - the row now
        // always stays on one line, and the text block shrinks + truncates
        // instead of pushing the actions button out.
        <div
            className={
                'flex flex-nowrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-3 transition last:border-0 dark:border-gray-700 sm:gap-3 sm:px-4 sm:py-3.5 ' +
                (selected ? 'bg-indigo-50/70 dark:bg-indigo-950/20' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/20')
            }
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <Checkbox checked={selected} onChange={onToggleSelect} className="shrink-0" />
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 sm:h-8 sm:w-8">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    {/* View-only access to the trashed project itself - Projects/Show.jsx already
                        renders a read-only banner and disables editing while a project is trashed
                        (see its `trashed` prop handling), and the projects.show route already
                        supports withTrashed(), so this just needed a link in. Task rows have no
                        equivalent standalone page, so titleHref is only ever passed for projects. */}
                    {titleHref ? (
                        <Link
                            href={titleHref}
                            className="truncate text-sm font-medium text-gray-800 hover:text-indigo-600 hover:underline dark:text-gray-200 dark:hover:text-indigo-400"
                        >
                            {title}
                        </Link>
                    ) : (
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{title}</p>
                    )}
                    <div className="mt-0.5 flex flex-nowrap items-center gap-x-1.5 overflow-hidden sm:gap-x-2">
                        {subtitle && <p className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
                        {subtitle && deletedLabel && <span className="shrink-0 text-gray-300 dark:text-gray-600">·</span>}
                        {deletedLabel && (
                            <>
                                {/* Full date+time from ~sm up; a short "Aug 3" form below that so the
                                    row never needs a second line to fit it. */}
                                <p className="hidden shrink-0 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 sm:inline">
                                    Deleted {deletedLabel}
                                </p>
                                <p className="shrink-0 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                    {deletedLabelShort}
                                </p>
                            </>
                        )}
                        {deletedLabel && <span className="shrink-0 text-gray-300 dark:text-gray-600">·</span>}
                        <span className="shrink-0">
                            <GraceBadge graceEndsAt={graceEndsAt} />
                        </span>
                    </div>
                </div>
            </div>
            <RowActionsMenu onRestore={onRestore} onDelete={onDelete} />
        </div>
    );
}

function EmptySection({ label, showClear, onClear }) {
    return (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <TrashIcon className="h-8 w-8 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>
            {showClear && (
                <button type="button" onClick={onClear} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Clear filters
                </button>
            )}
        </div>
    );
}

function SectionHeader({ label, count, allSelected, onToggleSelectAll }) {
    return (
        <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
            {count > 0 && (
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <Checkbox checked={allSelected} onChange={onToggleSelectAll} />
                    Select all
                </label>
            )}
        </div>
    );
}

// A selectable row for the "delete from here" picker - same visual language
// as TrashRow, but without the restore/delete-forever kebab menu, since here
// the whole row's job is just to be checked and included in the bulk delete.
function PickRow({ icon, title, subtitle, selected, onToggleSelect }) {
    return (
        <label
            className={
                'flex cursor-pointer flex-nowrap items-center gap-2 border-b border-gray-100 px-3 py-3 transition last:border-0 dark:border-gray-700 sm:gap-3 sm:px-4 sm:py-3.5 ' +
                (selected ? 'bg-indigo-50/70 dark:bg-indigo-950/20' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/20')
            }
        >
            <Checkbox checked={selected} onChange={onToggleSelect} className="shrink-0" />
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 sm:h-8 sm:w-8">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{title}</p>
                {subtitle && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
        </label>
    );
}

export default function Trash({ trashedProjects, trashedTasks, deletableProjects, deletableTasks }) {
    const { confirm, ConfirmDialog } = useConfirm();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [urgencyFilter, setUrgencyFilter] = useState('all');
    const [deletedFrom, setDeletedFrom] = useState('');
    const [deletedTo, setDeletedTo] = useState('');
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);

    // State for the separate "delete from here" picker below - lets someone
    // send still-active projects/tasks to the trash without leaving this page.
    const [showDeletePicker, setShowDeletePicker] = useState(false);
    const [existingSearch, setExistingSearch] = useState('');
    const [selectedExistingProjectIds, setSelectedExistingProjectIds] = useState([]);
    const [selectedExistingTaskIds, setSelectedExistingTaskIds] = useState([]);

    // A restore/delete round-trip changes the underlying arrays - drop any
    // selection referencing ids that no longer exist in the trash.
    useEffect(() => {
        setSelectedProjectIds((prev) => prev.filter((id) => trashedProjects.some((p) => p.id === id)));
        setSelectedTaskIds((prev) => prev.filter((id) => trashedTasks.some((t) => t.id === id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trashedProjects, trashedTasks]);

    // Same idea for the delete picker - once something's sent to trash (or a
    // project's deletion request goes out) it drops out of these lists, so
    // any stale selection referencing it needs to go too.
    useEffect(() => {
        setSelectedExistingProjectIds((prev) => prev.filter((id) => deletableProjects.some((p) => p.id === id)));
        setSelectedExistingTaskIds((prev) => prev.filter((id) => deletableTasks.some((t) => t.id === id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deletableProjects, deletableTasks]);

    const matchesUrgency = (graceEndsAt) => {
        if (urgencyFilter === 'all') return true;
        const days = daysLeft(graceEndsAt);
        if (days === null) return false;
        return urgencyFilter === 'today' ? days === 0 : days <= 3;
    };

    // Filters by the date the item was moved to trash, matching the "Deleted
    // on" custom range in the Filters panel - inclusive on both ends, with
    // `to` extended through the end of that day so picking the same day
    // twice still matches items trashed any time on it.
    const matchesDeletedRange = (deletedAt) => {
        if (!deletedFrom && !deletedTo) return true;
        const deletedDate = new Date(deletedAt);
        if (deletedFrom && deletedDate < new Date(deletedFrom)) return false;
        if (deletedTo) {
            const upperBound = new Date(deletedTo);
            upperBound.setHours(23, 59, 59, 999);
            if (deletedDate > upperBound) return false;
        }
        return true;
    };

    const filteredProjects = useMemo(() => {
        if (typeFilter === 'tasks') return [];
        const q = search.trim().toLowerCase();
        return trashedProjects.filter((project) => {
            if (q && !project.name.toLowerCase().includes(q)) return false;
            if (!matchesDeletedRange(project.deleted_at)) return false;
            return matchesUrgency(project.grace_ends_at);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trashedProjects, typeFilter, search, urgencyFilter, deletedFrom, deletedTo]);

    const filteredTasks = useMemo(() => {
        if (typeFilter === 'projects') return [];
        const q = search.trim().toLowerCase();
        return trashedTasks.filter((task) => {
            if (q && !task.title.toLowerCase().includes(q) && !task.project_name.toLowerCase().includes(q)) return false;
            if (!matchesDeletedRange(task.deleted_at)) return false;
            return matchesUrgency(task.grace_ends_at);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trashedTasks, typeFilter, search, urgencyFilter, deletedFrom, deletedTo]);

    const hasActiveFilters = search.trim() !== '' || typeFilter !== 'all' || urgencyFilter !== 'all' || Boolean(deletedFrom || deletedTo);
    const activeFilterCount = [typeFilter !== 'all', urgencyFilter !== 'all', Boolean(deletedFrom || deletedTo)].filter(Boolean).length;
    const clearFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setUrgencyFilter('all');
        setDeletedFrom('');
        setDeletedTo('');
    };
    const handleDeletedRangeApply = (from, to) => {
        setDeletedFrom(from);
        setDeletedTo(to);
    };

    const allProjectsSelected = filteredProjects.length > 0 && filteredProjects.every((p) => selectedProjectIds.includes(p.id));
    const allTasksSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id));

    const toggleProjectSelected = (id) => {
        setSelectedProjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleTaskSelected = (id) => {
        setSelectedTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleSelectAllProjects = () => {
        setSelectedProjectIds(allProjectsSelected ? [] : filteredProjects.map((p) => p.id));
    };
    const toggleSelectAllTasks = () => {
        setSelectedTaskIds(allTasksSelected ? [] : filteredTasks.map((t) => t.id));
    };

    const selectedCount = selectedProjectIds.length + selectedTaskIds.length;
    const clearSelection = () => {
        setSelectedProjectIds([]);
        setSelectedTaskIds([]);
    };

    const restoreSelected = async () => {
        const ok = await confirm(
            `Restore ${selectedCount} selected item${selectedCount === 1 ? '' : 's'}? Trashed tasks belonging to a selected project come back with it.`,
            { title: `Restore ${selectedCount} item${selectedCount === 1 ? '' : 's'}`, confirmLabel: 'Restore' }
        );
        if (!ok) return;
        router.post(route('trash.restore-selected'), {
            project_ids: selectedProjectIds,
            task_ids: selectedTaskIds,
        }, { preserveScroll: true, onSuccess: clearSelection });
    };

    const deleteSelectedForever = async () => {
        const ok = await confirm(
            `This permanently deletes ${selectedCount} selected item${selectedCount === 1 ? '' : 's'} and everything inside them. This cannot be undone.`,
            { title: `Delete ${selectedCount} item${selectedCount === 1 ? '' : 's'} forever`, danger: true, confirmLabel: 'Delete forever' }
        );
        if (!ok) return;
        router.delete(route('trash.force-delete-selected'), {
            data: { project_ids: selectedProjectIds, task_ids: selectedTaskIds },
            preserveScroll: true,
            onSuccess: clearSelection,
        });
    };

    const restoreProject = async (project) => {
        const ok = await confirm(`Restore "${project.name}"? Its trashed tasks will come back too.`, {
            title: 'Restore project',
            confirmLabel: 'Restore',
        });
        if (ok) router.post(route('projects.restore', project.id));
    };

    const deleteProjectForever = async (project) => {
        const ok = await confirm(
            `This permanently deletes "${project.name}" and everything in it (tasks, comments, files). This cannot be undone.`,
            { title: 'Delete project forever', danger: true, confirmLabel: 'Delete forever' }
        );
        if (ok) router.delete(route('projects.force-delete', project.id));
    };

    const restoreTask = async (task) => {
        const ok = await confirm(`Restore "${task.title}" back into ${task.project_name}?`, {
            title: 'Restore task',
            confirmLabel: 'Restore',
        });
        if (ok) router.post(route('tasks.restore', task.id));
    };

    const deleteTaskForever = async (task) => {
        const ok = await confirm(
            `This permanently deletes "${task.title}" and its comments, files, and checklist. This cannot be undone.`,
            { title: 'Delete task forever', danger: true, confirmLabel: 'Delete forever' }
        );
        if (ok) router.delete(route('tasks.force-delete', task.id));
    };

    // --- "Delete from here" picker: active (not-yet-trashed) projects/tasks ---

    const filteredDeletableProjects = useMemo(() => {
        const q = existingSearch.trim().toLowerCase();
        return deletableProjects.filter((project) => !q || project.name.toLowerCase().includes(q));
    }, [deletableProjects, existingSearch]);

    const filteredDeletableTasks = useMemo(() => {
        const q = existingSearch.trim().toLowerCase();
        return deletableTasks.filter(
            (task) => !q || task.title.toLowerCase().includes(q) || task.project_name.toLowerCase().includes(q)
        );
    }, [deletableTasks, existingSearch]);

    const allDeletableProjectsSelected = filteredDeletableProjects.length > 0
        && filteredDeletableProjects.every((p) => selectedExistingProjectIds.includes(p.id));
    const allDeletableTasksSelected = filteredDeletableTasks.length > 0
        && filteredDeletableTasks.every((t) => selectedExistingTaskIds.includes(t.id));

    const toggleExistingProjectSelected = (id) => {
        setSelectedExistingProjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleExistingTaskSelected = (id) => {
        setSelectedExistingTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleSelectAllDeletableProjects = () => {
        setSelectedExistingProjectIds(allDeletableProjectsSelected ? [] : filteredDeletableProjects.map((p) => p.id));
    };
    const toggleSelectAllDeletableTasks = () => {
        setSelectedExistingTaskIds(allDeletableTasksSelected ? [] : filteredDeletableTasks.map((t) => t.id));
    };

    const selectedExistingCount = selectedExistingProjectIds.length + selectedExistingTaskIds.length;
    const clearExistingSelection = () => {
        setSelectedExistingProjectIds([]);
        setSelectedExistingTaskIds([]);
    };

    const deleteExistingSelected = async () => {
        const taskCount = selectedExistingTaskIds.length;
        const projectCount = selectedExistingProjectIds.length;

        const lines = [];
        if (taskCount > 0) {
            lines.push(`${taskCount} task${taskCount === 1 ? '' : 's'} will move to trash immediately.`);
        }
        if (projectCount > 0) {
            // Deleting a project never happens instantly here either - it always
            // needs the owner's email confirmation first, same as deleting one
            // from its own settings page.
            lines.push(
                `${projectCount} project${projectCount === 1 ? '' : 's'} will get a deletion confirmation email` +
                ` - nothing happens to ${projectCount === 1 ? 'it' : 'them'} until you click the link.`
            );
        }

        const ok = await confirm(lines.join(' '), {
            title: `Delete ${selectedExistingCount} item${selectedExistingCount === 1 ? '' : 's'}`,
            danger: true,
            confirmLabel: 'Delete',
        });
        if (!ok) return;

        router.post(route('trash.delete-existing'), {
            project_ids: selectedExistingProjectIds,
            task_ids: selectedExistingTaskIds,
        }, { preserveScroll: true, onSuccess: clearExistingSelection });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('dashboard')} label="Back to Dashboard" />
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                    <TrashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    Trash
                </h2>
            </div>
        }>
            <Head title="Trash" />
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-4xl space-y-4 px-3 sm:space-y-6 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Deleted projects and tasks sit here before they're gone for good. Only projects you own and tasks in projects you manage show up here.
                    </p>

                    <div className="space-y-3">
                        {/* flex-nowrap: the search box flexes/shrinks instead of the Filters
                            button dropping to a second line on narrow screens. */}
                        <div className="flex flex-nowrap items-center gap-2">
                            <SearchInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search trash..."
                                className="w-full min-w-0 text-sm sm:w-56"
                            />
                            <FiltersMenu activeCount={activeFilterCount} onClear={clearFilters}>
                                <FiltersMenu.Row label="Type">
                                    <FilterSelect className="w-full" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} />
                                </FiltersMenu.Row>
                                <FiltersMenu.Row label="Purging">
                                    <FilterSelect className="w-full" value={urgencyFilter} onChange={setUrgencyFilter} options={URGENCY_OPTIONS} />
                                </FiltersMenu.Row>
                                <DateRangeFilter from={deletedFrom} to={deletedTo} onApply={handleDeletedRangeApply} />
                            </FiltersMenu>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {filteredProjects.length + filteredTasks.length} item{filteredProjects.length + filteredTasks.length === 1 ? '' : 's'} match{filteredProjects.length + filteredTasks.length === 1 ? 'es' : ''} your filters
                        </p>
                    </div>

                    {selectedCount > 0 && (
                        <div className="sticky top-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 shadow dark:bg-indigo-950/40 sm:gap-3 sm:px-4 sm:py-3">
                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
                                {selectedProjectIds.length > 0 && selectedTaskIds.length > 0 && (
                                    <span className="font-normal text-indigo-600/80 dark:text-indigo-400/80">
                                        {' '}({selectedProjectIds.length} project{selectedProjectIds.length === 1 ? '' : 's'}, {selectedTaskIds.length} task{selectedTaskIds.length === 1 ? '' : 's'})
                                    </span>
                                )}
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button onClick={clearSelection} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                                    Clear
                                </button>
                                <button
                                    onClick={restoreSelected}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-white px-2.5 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-700 dark:bg-gray-800 dark:text-indigo-300 dark:hover:bg-gray-700 sm:px-3 sm:py-1.5"
                                >
                                    <UndoIcon />
                                    <span className="hidden sm:inline">Restore selected</span>
                                    <span className="sm:hidden">Restore</span>
                                </button>
                                <button
                                    onClick={deleteSelectedForever}
                                    className="rounded-md bg-red-600 px-2.5 py-1 text-sm font-medium text-white transition hover:bg-red-500 sm:px-3 sm:py-1.5"
                                >
                                    <span className="hidden sm:inline">Delete forever</span>
                                    <span className="sm:hidden">Delete</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {typeFilter !== 'tasks' && (
                        <div>
                            <SectionHeader
                                label="Projects"
                                count={filteredProjects.length}
                                allSelected={allProjectsSelected}
                                onToggleSelectAll={toggleSelectAllProjects}
                            />
                            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                {filteredProjects.length === 0 ? (
                                    <EmptySection
                                        label={trashedProjects.length === 0 ? 'No deleted projects.' : 'No projects match your filters.'}
                                        showClear={trashedProjects.length > 0 && hasActiveFilters}
                                        onClear={clearFilters}
                                    />
                                ) : (
                                    filteredProjects.map((project) => (
                                        <TrashRow
                                            key={project.id}
                                            icon={<ProjectItemIcon />}
                                            title={project.name}
                                            titleHref={project.url}
                                            subtitle={`${project.tasks_count} task${project.tasks_count === 1 ? '' : 's'}`}
                                            deletedAt={project.deleted_at}
                                            graceEndsAt={project.grace_ends_at}
                                            selected={selectedProjectIds.includes(project.id)}
                                            onToggleSelect={() => toggleProjectSelected(project.id)}
                                            onRestore={() => restoreProject(project)}
                                            onDelete={() => deleteProjectForever(project)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {typeFilter !== 'projects' && (
                        <div>
                            <SectionHeader
                                label="Tasks"
                                count={filteredTasks.length}
                                allSelected={allTasksSelected}
                                onToggleSelectAll={toggleSelectAllTasks}
                            />
                            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                {filteredTasks.length === 0 ? (
                                    <EmptySection
                                        label={trashedTasks.length === 0 ? 'No deleted tasks.' : 'No tasks match your filters.'}
                                        showClear={trashedTasks.length > 0 && hasActiveFilters}
                                        onClear={clearFilters}
                                    />
                                ) : (
                                    filteredTasks.map((task) => (
                                        <TrashRow
                                            key={task.id}
                                            icon={<TaskItemIcon />}
                                            title={task.title}
                                            subtitle={task.project_name}
                                            deletedAt={task.deleted_at}
                                            graceEndsAt={task.grace_ends_at}
                                            selected={selectedTaskIds.includes(task.id)}
                                            onToggleSelect={() => toggleTaskSelected(task.id)}
                                            onRestore={() => restoreTask(task)}
                                            onDelete={() => deleteTaskForever(task)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-200 pt-4 dark:border-gray-700 sm:pt-6">
                        <button
                            type="button"
                            onClick={() => setShowDeletePicker((v) => !v)}
                            className="flex w-full items-center justify-between gap-2 text-left"
                        >
                            <span>
                                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Delete from your projects and tasks
                                </span>
                                <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                                    Pick existing projects or tasks to send to the trash, without opening each one.
                                </span>
                            </span>
                            <svg
                                className={`h-5 w-5 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${showDeletePicker ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDeletePicker && (
                            <div className="mt-4 space-y-4">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    Tasks move to trash right away. Deleting a project always sends you a confirmation
                                    email first - it only moves to trash once you click the link in it.
                                </p>

                                <SearchInput
                                    value={existingSearch}
                                    onChange={(e) => setExistingSearch(e.target.value)}
                                    placeholder="Search your projects and tasks..."
                                    className="w-full min-w-0 text-sm sm:w-56"
                                />

                                {selectedExistingCount > 0 && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2.5 dark:bg-red-950/20 sm:gap-3 sm:px-4 sm:py-3">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                            {selectedExistingCount} item{selectedExistingCount === 1 ? '' : 's'} selected
                                            {selectedExistingProjectIds.length > 0 && selectedExistingTaskIds.length > 0 && (
                                                <span className="font-normal text-red-600/80 dark:text-red-400/80">
                                                    {' '}({selectedExistingProjectIds.length} project{selectedExistingProjectIds.length === 1 ? '' : 's'}, {selectedExistingTaskIds.length} task{selectedExistingTaskIds.length === 1 ? '' : 's'})
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button onClick={clearExistingSelection} className="text-sm text-red-600 hover:underline dark:text-red-400">
                                                Clear
                                            </button>
                                            <button
                                                onClick={deleteExistingSelected}
                                                className="rounded-md bg-red-600 px-2.5 py-1 text-sm font-medium text-white transition hover:bg-red-500 sm:px-3 sm:py-1.5"
                                            >
                                                Delete selected
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <SectionHeader
                                        label="Your projects"
                                        count={filteredDeletableProjects.length}
                                        allSelected={allDeletableProjectsSelected}
                                        onToggleSelectAll={toggleSelectAllDeletableProjects}
                                    />
                                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                        {filteredDeletableProjects.length === 0 ? (
                                            <EmptySection
                                                label={deletableProjects.length === 0 ? 'No projects available to delete.' : 'No projects match your search.'}
                                            />
                                        ) : (
                                            filteredDeletableProjects.map((project) => (
                                                <PickRow
                                                    key={project.id}
                                                    icon={<ProjectItemIcon />}
                                                    title={project.name}
                                                    subtitle={`${project.tasks_count} task${project.tasks_count === 1 ? '' : 's'}`}
                                                    selected={selectedExistingProjectIds.includes(project.id)}
                                                    onToggleSelect={() => toggleExistingProjectSelected(project.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <SectionHeader
                                        label="Tasks you manage"
                                        count={filteredDeletableTasks.length}
                                        allSelected={allDeletableTasksSelected}
                                        onToggleSelectAll={toggleSelectAllDeletableTasks}
                                    />
                                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                        {filteredDeletableTasks.length === 0 ? (
                                            <EmptySection
                                                label={deletableTasks.length === 0 ? 'No tasks available to delete.' : 'No tasks match your search.'}
                                            />
                                        ) : (
                                            filteredDeletableTasks.map((task) => (
                                                <PickRow
                                                    key={task.id}
                                                    icon={<TaskItemIcon />}
                                                    title={task.title}
                                                    subtitle={task.project_name}
                                                    selected={selectedExistingTaskIds.includes(task.id)}
                                                    onToggleSelect={() => toggleExistingTaskSelected(task.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {ConfirmDialog}
        </AuthenticatedLayout>
    );
}
