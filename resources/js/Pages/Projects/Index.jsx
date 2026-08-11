import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import FilterSelect from '@/Components/FilterSelect';
import ViewToggle from '@/Components/ViewToggle';
import PerPageSelect from '@/Components/PerPageSelect';
import LocalPagination from '@/Components/LocalPagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RichTextEditor from '@/Components/RichTextEditor';
import RichTextContent from '@/Components/RichTextContent';
import useConfirm from '@/hooks/useConfirm';
import useMuteScope from '@/hooks/useMuteScope';

const roleStyles = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    tester: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function EmptyState({ hasAnyProjects, showingArchived, onNewProject, onClearFilters }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 text-center dark:border-gray-700">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            </div>
            {hasAnyProjects ? (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No projects match your search</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Try a different name, owner, or role filter.</p>
                    <button onClick={onClearFilters} className="mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        Clear filters
                    </button>
                </>
            ) : showingArchived ? (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No archived projects</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Projects you archive will show up here.</p>
                </>
            ) : (
                <>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">You don't have any projects yet</p>
                    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Create your first project to get started.</p>
                    <PrimaryButton onClick={onNewProject} className="mt-4">New Project</PrimaryButton>
                </>
            )}
        </div>
    );
}

function ProjectActionsMenu({ project, showingArchived, onPin, onUnpin, onArchive, onUnarchive, onMute, onUnmute }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 176;

    const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
        }
        setOpen((v) => !v);
    };

    // If there isn't enough room below the button (e.g. the last row in the
    // list, near the bottom of the viewport), open the menu upward instead
    // of letting it spill past the edge of the screen.
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

    const isPinned = !!project.pivot?.pinned;
    const isMuted = !!(project.pivot?.mute_in_app || project.pivot?.mute_email);

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                title="More actions"
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-gray-400 opacity-100 transition hover:bg-gray-100 hover:text-gray-600 sm:text-gray-300 sm:opacity-0 sm:group-hover:opacity-100 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:sm:text-gray-600"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && createPortal(
                <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }} className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); isPinned ? onUnpin() : onPin(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        <svg className="h-4 w-4" fill={isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {isPinned ? 'Unpin' : 'Pin to top'}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); isMuted ? onUnmute() : onMute(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        {isMuted ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.17 9.17A3 3 0 0012 15a2.99 2.99 0 002.83-2M17.61 17.61A9 9 0 016 18v-6a8.96 8.96 0 011.09-4.29M12 3a3 3 0 013 3v2m3 2v1a9 9 0 01-.36 2.52" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        )}
                        {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                    </button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); showingArchived ? onUnarchive() : onArchive(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {showingArchived ? 'Unarchive' : 'Archive'}
                    </button>
                </div>,
                document.body
            )}
        </>
    );
}

export default function Index({ projects, showingArchived, activeCount, archivedCount }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return localStorage.getItem('synkro:projects-view') ?? 'grid';
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const paginationRef = useRef(null);
    const { confirm, ConfirmDialog } = useConfirm();
    const { askMuteScope, MuteScopeDialog } = useMuteScope();

    const changeView = (next) => {
        setView(next);
        try { localStorage.setItem('synkro:projects-view', next); } catch { /* private browsing, etc. */ }
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        setPage(1);
    };

    const createForm = useForm({ name: '', description: '' });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('projects.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        createForm.reset();
        createForm.clearErrors();
    };

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('all');
        setPage(1);
    };

    const switchTab = (archived) => {
        router.get(route('projects.index'), { archived: archived ? 1 : undefined }, { preserveState: false });
    };

    const archiveProject = async (project) => {
        if (await confirm('This only affects your own view; other members will still see it normally. You can unarchive it anytime.', { title: `Archive "${project.name}"?` })) {
            router.post(route('projects.archive', project.id), {}, { preserveScroll: true });
        }
    };

    const unarchiveProject = (project) => {
        router.post(route('projects.unarchive', project.id), {}, { preserveScroll: true });
    };

    const pinProject = (project) => router.post(route('projects.pin', project.id), {}, { preserveScroll: true });
    const unpinProject = (project) => router.post(route('projects.unpin', project.id), {}, { preserveScroll: true });
    const unmuteProject = (project) => router.post(route('projects.unmute', project.id), {}, { preserveScroll: true });
    const muteProject = async (project) => {
        const muteInApp = !!project.pivot?.mute_in_app;
        const muteEmail = !!project.pivot?.mute_email;
        const scope = await askMuteScope({
            title: 'Mute Notifications',
            message: `Choose which notifications to mute for every task in "${project.name}".`,
            defaultScope: muteInApp && muteEmail ? 'both' : muteInApp ? 'in_app' : muteEmail ? 'email' : 'both',
        });
        if (!scope) return;
        router.post(route('projects.mute', project.id), { scope }, { preserveScroll: true });
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return projects.filter((project) => {
            if (roleFilter !== 'all' && project.pivot?.role !== roleFilter) return false;
            if (!term) return true;

            return (
                project.name.toLowerCase().includes(term) ||
                project.owner?.name?.toLowerCase().includes(term) ||
                project.owner?.email?.toLowerCase().includes(term)
            );
        });
    }, [projects, search, roleFilter]);

    const hasActiveFilters = search.trim() !== '' || roleFilter !== 'all';

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Projects</h2>}>
            <Head title="Projects" />
            <div className="py-12">

                <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">

                    <div className="mb-6 inline-flex gap-1 rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-transparent dark:bg-gray-800">
                        <button
                            onClick={() => switchTab(false)}
                            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
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
                            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
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

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                            <div className="relative w-full sm:w-auto">
                                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                    <SearchIcon />
                                </div>
                                <TextInput
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search by project name or owner..."
                                    className="w-full pl-9 sm:w-72"
                                />
                            </div>
                            <FilterSelect
                                value={roleFilter}
                                onChange={(v) => { setRoleFilter(v); setPage(1); }}
                                className="w-36"
                                options={[
                                    { value: 'all', label: 'All Roles' },
                                    { value: 'owner', label: 'Owner' },
                                    { value: 'manager', label: 'Manager' },
                                    { value: 'member', label: 'Member' },
                                    { value: 'tester', label: 'Tester' },
                                ]}
                            />
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                    Clear
                                </button>
                            )}
                        </div>
                        {!showingArchived && (
                            <button onClick={() => setShowCreateModal(true)} className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                                New Project
                            </button>
                        )}
                    </div>

                    {projects.length > 0 && (
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {filtered.length} of {projects.length} project{projects.length > 1 ? 's' : ''}
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
                            <div className="hidden border-b border-gray-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:grid sm:grid-cols-[1fr_10rem_6rem_8rem_2.5rem] sm:items-center sm:gap-3">
                                <span>Project</span>
                                <span>Owner</span>
                                <span className="text-right">Tasks</span>
                                <span>Progress</span>
                                <span></span>
                            </div>
                            <ul>
                                {paginated.map((project) => {
                                    const progress = project.tasks_count > 0
                                        ? Math.round((project.done_tasks_count / project.tasks_count) * 100)
                                        : 0;
                                    const progressColor = progress === 100 ? 'bg-green-500' : 'bg-indigo-500';

                                    return (
                                        <li key={project.id} className="group relative border-b border-gray-100 last:border-0 dark:border-gray-700">
                                            <ProjectActionsMenu
                                                project={project}
                                                showingArchived={showingArchived}
                                                onPin={() => pinProject(project)}
                                                onUnpin={() => unpinProject(project)}
                                                onArchive={() => archiveProject(project)}
                                                onUnarchive={() => unarchiveProject(project)}
                                                onMute={() => muteProject(project)}
                                                onUnmute={() => unmuteProject(project)}
                                            />
                                            <Link
                                                href={route('projects.show', project.id)}
                                                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 pr-10 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:grid-cols-[1fr_10rem_6rem_8rem_2.5rem]"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100" title={project.name}>
                                                            {project.name}
                                                        </span>
                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${roleStyles[project.pivot?.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                            {project.pivot?.role}
                                                        </span>
                                                        {!!project.pivot?.pinned && (
                                                            <svg title="Pinned" className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                            </svg>
                                                        )}
                                                        {!!(project.pivot?.mute_in_app || project.pivot?.mute_email) && (
                                                            <svg title="Notifications muted" className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9M3 3l18 18" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500 sm:hidden">
                                                        {project.owner?.name} · {project.tasks_count} tasks · {progress}% done
                                                    </p>
                                                    {!!project.description && (
                                                        <RichTextContent
                                                            as="p"
                                                            className="mt-0.5 hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block [&_*]:inline"
                                                            html={project.description}
                                                        />
                                                    )}
                                                </div>
                                                <div className="hidden min-w-0 items-center gap-2 sm:flex">
                                                    <Avatar user={project.owner} size="h-5 w-5" />
                                                    <span className="truncate text-sm text-gray-500 dark:text-gray-400" title={project.owner?.name}>
                                                        {project.owner?.name}
                                                    </span>
                                                </div>
                                                <span className="hidden text-right text-sm text-gray-500 dark:text-gray-400 sm:block">
                                                    {project.tasks_count}
                                                </span>
                                                <div className="hidden items-center gap-2 sm:flex">
                                                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                                        <div className={`h-1.5 rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                    <span className="w-9 shrink-0 text-right text-xs text-gray-400 dark:text-gray-500">{progress}%</span>
                                                </div>
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
                        {filtered.map((project) => {
                            const progress = project.tasks_count > 0
                                ? Math.round((project.done_tasks_count / project.tasks_count) * 100)
                                : 0;
                            const progressColor = progress === 100 ? 'bg-green-500' : 'bg-indigo-500';
                            const isOwner = !!auth?.user && project.owner_id === auth.user.id;

                            return (
                                <div
                                    key={project.id}
                                    className="group relative rounded-lg border border-transparent bg-white p-4 shadow transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md group-focus-within:ring-2 group-focus-within:ring-indigo-400 dark:bg-gray-800 dark:hover:border-indigo-900 dark:group-focus-within:ring-indigo-500 sm:p-6"
                                >
                                    <ProjectActionsMenu
                                        project={project}
                                        isOwner={isOwner}
                                        showingArchived={showingArchived}
                                        onPin={() => pinProject(project)}
                                        onUnpin={() => unpinProject(project)}
                                        onArchive={() => archiveProject(project)}
                                        onUnarchive={() => unarchiveProject(project)}
                                        onMute={() => muteProject(project)}
                                        onUnmute={() => unmuteProject(project)}
                                    />
                                    {/* Browser back-navigation restores keyboard focus to whichever
                                        card link was last clicked, and by default that shows the
                                        browser's own square, off-brand focus outline. outline-none
                                        here + group-focus-within:ring-2 on the card above swaps it
                                        for a ring that follows the card's own rounded-lg shape
                                        instead, so it reads as an intentional highlight rather than
                                        a leftover browser artifact. */}
                                    <Link href={route('projects.show', project.id)} className="block rounded-lg focus:outline-none">
                                        <div className="flex items-start justify-between gap-2 pr-6">
                                            <h3 className="min-w-0 truncate text-lg font-semibold text-gray-900 dark:text-gray-100" title={project.name}>
                                                {project.name}
                                            </h3>
                                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium capitalize ${roleStyles[project.pivot?.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {project.pivot?.role}
                                            </span>
                                        </div>
                                        <RichTextContent
                                            className="mt-2 line-clamp-2 min-h-10 whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100"
                                            style={{ tabSize: 4 }}
                                            html={project.description}
                                            fallback='<span class="text-gray-400">No description provided.</span>'
                                        />

                                        <div className="mt-4 flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Avatar user={project.owner} size="h-6 w-6" />
                                                <p className="truncate text-xs text-gray-400 dark:text-gray-500" title={project.owner?.name}>
                                                    {project.owner?.name}
                                                </p>
                                                {!!project.pivot?.pinned && (
                                                    <span title="Pinned" className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                        Pinned
                                                    </span>
                                                )}
                                                {!!(project.pivot?.mute_in_app || project.pivot?.mute_email) && (
                                                    <span title="Notifications muted" className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9M3 3l18 18" />
                                                        </svg>
                                                        Muted
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                {project.tasks_count} tasks
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div className={`h-1.5 rounded-full transition-all ${progressColor}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">{progress}% done</p>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                    )}

                    {filtered.length === 0 && (
                        <div className="grid">
                            <EmptyState
                                hasAnyProjects={projects.length > 0}
                                showingArchived={showingArchived}
                                onNewProject={() => setShowCreateModal(true)}
                                onClearFilters={clearFilters}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showCreateModal} onClose={closeCreateModal} overlayClassName="bg-black/55 dark:bg-black/70">
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Project</h2>
                    <div className="mt-4">
                        <InputLabel htmlFor="create-name" value="Project Name" />
                        <TextInput
                            id="create-name"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            className="mt-1 block w-full"
                            autoFocus
                        />
                        <InputError message={createForm.errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="create-description" value="Description" />
                        <RichTextEditor
                            value={createForm.data.description}
                            onChange={(html) => createForm.setData('description', html)}
                        />
                        <InputError message={createForm.errors.description} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton onClick={closeCreateModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={createForm.processing}>
                            {createForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                            Create Project
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
            {ConfirmDialog}
            {MuteScopeDialog}
            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}
