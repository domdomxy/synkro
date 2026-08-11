import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import DeliverableViewer from '@/Components/DeliverableViewer';
import FileTypeIcon, { formatSize, getFileTypeMeta, LINK_META } from '@/Components/FileTypeIcon';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import ProjectMenu from '@/Components/ProjectMenu';
import ProjectInfoModal from '@/Components/ProjectInfoModal';
import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';

function FolderIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function ChevronIcon({ open }) {
    return (
        <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function LinkIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    );
}

function DownloadIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
    );
}

function SearchIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function BoxIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

function SearchInput({ value, onChange, placeholder }) {
    return (
        <div className="relative flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
                <SearchIcon />
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-md border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
        </div>
    );
}

/**
 * One card per task, expandable to reveal its files. Each file's icon picks
 * up the same color-coded badge used on the Resources page, so a glance
 * down the open list tells you what's in there before you click anything.
 */
function TaskFolder({ task, onPreview, forceOpen }) {
    const [open, setOpen] = useState(false);
    const files = task.deliverables.filter((d) => d.type === 'file');
    if (files.length === 0) return null;
    const isOpen = forceOpen || open;
    const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="flex w-full items-center gap-2.5 px-4 py-3">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                >
                    <ChevronIcon open={isOpen} />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <FolderIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">{task.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {files.length} file{files.length > 1 ? 's' : ''}
                        {formatSize(totalSize) && <> &middot; {formatSize(totalSize)}</>}
                    </span>
                </button>
                <a
                    href={route('tasks.download', task.id)}
                    onClick={(e) => e.stopPropagation()}
                    title={`Download ${task.title} deliverables`}
                    className="flex shrink-0 items-center rounded bg-indigo-50 p-1.5 text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/70"
                >
                    <DownloadIcon className="h-4 w-4" />
                </a>
            </div>
            {isOpen && (
                <div className="space-y-1 border-t border-gray-100 bg-gray-50/60 px-4 py-2 pl-[3.25rem] dark:border-gray-700 dark:bg-gray-900/30">
                    {files.map((f) => {
                        const meta = getFileTypeMeta(f.original_name);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => onPreview(f)}
                                className="flex w-full items-center gap-2 rounded py-1.5 text-left text-sm text-gray-600 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                            >
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${meta.badge}`}>
                                    <FileTypeIcon name={f.original_name} className="h-3.5 w-3.5" />
                                </span>
                                <span className="truncate">{f.original_name}</span>
                                {formatSize(f.size) && <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{formatSize(f.size)}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Deliverables({ project, tasks, role }) {
    const isOwner = role === 'owner';
    const canManage = ['owner', 'manager'].includes(role);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const folderTasks = tasks.filter((t) => t.deliverables.some((d) => d.type === 'file'));
    const linkTasks = tasks.filter((t) => t.deliverables.some((d) => d.type === 'link'));
    const hasAnyFiles = folderTasks.length > 0;
    const [previewingDeliverable, setPreviewingDeliverable] = useState(null);
    const [search, setSearch] = useState('');
    const toolbarRef = useRef(null);

    const query = search.trim().toLowerCase();
    const visibleFolderTasks = query ? folderTasks.filter((t) => t.title.toLowerCase().includes(query)) : folderTasks;
    const visibleLinkTasks = query ? linkTasks.filter((t) => t.title.toLowerCase().includes(query)) : linkTasks;
    const isFiltering = query.length > 0;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                    <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                    <h2 className="min-w-0 truncate text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Deliverables: {project.name}
                    </h2>
                </div>
                <ProjectMenu
                    project={project}
                    page="deliverables"
                    isOwner={isOwner}
                    canManage={canManage}
                    onShowInfo={() => setShowInfoModal(true)}
                />
            </div>
        }>
            <Head title={`Deliverables - ${project.name}`} />
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-8xl space-y-5 px-3 sm:px-6 lg:px-8">

                    <div ref={toolbarRef} className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-400 dark:text-gray-500">Files and links from completed tasks</p>
                        {hasAnyFiles && (
                            <a
                                href={route('projects.deliverables.download', project.id)}
                                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                Download all
                            </a>
                        )}
                    </div>

                    {(folderTasks.length + linkTasks.length > 1) && (
                        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by task name..." />
                    )}

                    {folderTasks.length === 0 ? (
                        <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800/60">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400">
                                <BoxIcon className="h-7 w-7" />
                            </div>
                            <p className="max-w-xs text-sm text-gray-400 dark:text-gray-500">No files yet. They'll show up here once tasks with attached files are marked done.</p>
                        </div>
                    ) : visibleFolderTasks.length === 0 ? (
                        <div className="flex flex-col items-center rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-800/60">
                            <p className="text-sm text-gray-400 dark:text-gray-500">No file deliverables match "{search}".</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visibleFolderTasks.map((task) => <TaskFolder key={task.id} task={task} onPreview={setPreviewingDeliverable} forceOpen={isFiltering} />)}
                        </div>
                    )}

                    {linkTasks.length > 0 && visibleLinkTasks.length > 0 && (
                        <>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Links and documents</p>
                            <div className="space-y-2">
                                {visibleLinkTasks.map((task) =>
                                    task.deliverables.filter((d) => d.type === 'link').map((d) => (
                                        <div
                                            key={d.id}
                                            className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            {/* A colored accent stripe as a clipped inset element, not an actual
                                                thicker left border - mixing border-radius with an uneven
                                                per-side border width made the browser render a stray sliver
                                                outside the rounded corner instead of following it cleanly. */}
                                            <span className="absolute inset-y-0 left-0 w-1 bg-indigo-300 dark:bg-indigo-700" />
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${LINK_META.badge}`}>
                                                <LinkIcon className="h-4 w-4" />
                                            </span>
                                            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{task.title}</span>
                                            <a
                                                href={d.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                                                style={{ maxWidth: '220px' }}
                                                title={d.url}
                                            >
                                                {d.title || d.url}
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <DeliverableViewer deliverable={previewingDeliverable} onClose={() => setPreviewingDeliverable(null)} />

            <ScrollToPaginationButton targetRef={toolbarRef} />

            <ProjectInfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} project={project} />
        </AuthenticatedLayout>
    );
}
