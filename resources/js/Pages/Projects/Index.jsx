import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RichTextEditor from '@/Components/RichTextEditor';

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

function ProjectActionsMenu({ project, showingArchived, onPin, onUnpin, onArchive, onUnarchive }) {
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

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                title="More actions"
                className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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

export default function Index({ projects, showingArchived }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

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
    };

    const switchTab = (archived) => {
        router.get(route('projects.index'), { archived: archived ? 1 : undefined }, { preserveState: false });
    };

    const archiveProject = (project) => {
        if (confirm(`Archive "${project.name}"? This only affects your own view; other members will still see it normally. You can unarchive it anytime.`)) {
            router.post(route('projects.archive', project.id), {}, { preserveScroll: true });
        }
    };

    const unarchiveProject = (project) => {
        router.post(route('projects.unarchive', project.id), {}, { preserveScroll: true });
    };

    const pinProject = (project) => router.post(route('projects.pin', project.id), {}, { preserveScroll: true });
    const unpinProject = (project) => router.post(route('projects.unpin', project.id), {}, { preserveScroll: true });

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

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Projects</h2>}>
            <Head title="Projects" />
            <div className="py-12">

                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    <div className="mb-6 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" style={{ maxWidth: 280 }}>
                        <button
                            onClick={() => switchTab(false)}
                            className={`flex-1 py-2 text-sm font-medium transition ${
                                !showingArchived
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => switchTab(true)}
                            className={`flex-1 py-2 text-sm font-medium transition ${
                                showingArchived
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            Archived
                        </button>
                    </div>

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                    <SearchIcon />
                                </div>
                                <TextInput
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by project name or owner..."
                                    className="w-72 pl-9"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="all">All Roles</option>
                                <option value="owner">Owner</option>
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="tester">Tester</option>
                            </select>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                    Clear
                                </button>
                            )}
                        </div>
                        {!showingArchived && (
                            <PrimaryButton onClick={() => setShowCreateModal(true)}>New Project</PrimaryButton>
                        )}
                    </div>

                    {projects.length > 0 && (
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                            {filtered.length} of {projects.length} project{projects.length > 1 ? 's' : ''}
                        </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((project) => {
                            const progress = project.tasks_count > 0
                                ? Math.round((project.done_tasks_count / project.tasks_count) * 100)
                                : 0;
                            const progressColor = progress === 100 ? 'bg-green-500' : 'bg-indigo-500';
                            const isOwner = project.owner_id === auth.user.id;

                            return (
                                <div
                                    key={project.id}
                                    className="group relative rounded-lg border border-transparent bg-white p-6 shadow transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md dark:bg-gray-800 dark:hover:border-indigo-900"
                                >
                                    <ProjectActionsMenu
                                        project={project}
                                        isOwner={isOwner}
                                        showingArchived={showingArchived}
                                        onPin={() => pinProject(project)}
                                        onUnpin={() => unpinProject(project)}
                                        onArchive={() => archiveProject(project)}
                                        onUnarchive={() => unarchiveProject(project)}
                                    />
                                    <Link href={route('projects.show', project.id)} className="block">
                                        <div className="flex items-start justify-between gap-2 pr-6">
                                            <h3 className="min-w-0 truncate text-lg font-semibold text-gray-900 dark:text-gray-100" title={project.name}>
                                                {project.name}
                                            </h3>
                                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium capitalize ${roleStyles[project.pivot?.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {project.pivot?.role}
                                            </span>
                                        </div>
                                        <div
                                            className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-900 dark:text-gray-100"
                                            dangerouslySetInnerHTML={{ __html: project.description || '<span class="text-gray-400">No description provided.</span>' }}
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
                        {filtered.length === 0 && (
                            <EmptyState
                                hasAnyProjects={projects.length > 0}
                                showingArchived={showingArchived}
                                onNewProject={() => setShowCreateModal(true)}
                                onClearFilters={clearFilters}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showCreateModal} onClose={closeCreateModal}>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">New Project</h2>
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
                        <PrimaryButton disabled={createForm.processing}>Create Project</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
