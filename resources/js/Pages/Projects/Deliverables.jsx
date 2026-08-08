import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import DeliverableViewer from '@/Components/DeliverableViewer';
import FileTypeIcon, { formatSize } from '@/Components/FileTypeIcon';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
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
                className="w-full rounded-lg border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
        </div>
    );
}

/** Compact summary strip - a quick read on how much has actually come out of the project's tasks. */
function SummaryStrip({ taskCount, fileCount, linkCount }) {
    const stats = [
        { label: 'Tasks with deliverables', value: taskCount },
        { label: 'Files', value: fileCount },
        ...(linkCount ? [{ label: 'Links', value: linkCount }] : []),
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-100">{s.value}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{s.label}</span>
                </div>
            ))}
        </div>
    );
}

function TaskFolder({ task, onPreview, forceOpen }) {
    const [open, setOpen] = useState(false);
    const files = task.deliverables.filter((d) => d.type === 'file');
    if (files.length === 0) return null;
    const isOpen = forceOpen || open;
    const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

    return (
        <div className="border-b border-gray-100 last:border-0 dark:border-gray-700">
            <div className="flex w-full items-center gap-2.5 px-4 py-2.5 transition hover:bg-gray-50/70 dark:hover:bg-gray-700/20">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex flex-1 items-center gap-2.5 text-left"
                >
                    <ChevronIcon open={isOpen} />
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
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
                    className="flex shrink-0 items-center rounded-md bg-indigo-50 p-1.5 text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/70"
                >
                    <DownloadIcon className="h-4 w-4" />
                </a>
            </div>
            {isOpen && (
                <div className="pb-1.5 pl-12">
                    {files.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => onPreview(f)}
                            className="flex w-full items-center gap-2 py-1 text-left text-sm text-gray-600 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                        >
                            <FileTypeIcon name={f.original_name} className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{f.original_name}</span>
                            {formatSize(f.size) && <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{formatSize(f.size)}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Deliverables({ project, tasks }) {
    const folderTasks = tasks.filter((t) => t.deliverables.some((d) => d.type === 'file'));
    const linkTasks = tasks.filter((t) => t.deliverables.some((d) => d.type === 'link'));
    const hasAnyFiles = folderTasks.length > 0;
    const [previewingDeliverable, setPreviewingDeliverable] = useState(null);
    const [search, setSearch] = useState('');
    const toolbarRef = useRef(null);

    const totalFileCount = folderTasks.reduce((sum, t) => sum + t.deliverables.filter((d) => d.type === 'file').length, 0);
    const totalLinkCount = linkTasks.reduce((sum, t) => sum + t.deliverables.filter((d) => d.type === 'link').length, 0);
    const tasksWithDeliverables = new Set([...folderTasks.map((t) => t.id), ...linkTasks.map((t) => t.id)]).size;

    const query = search.trim().toLowerCase();
    const visibleFolderTasks = query ? folderTasks.filter((t) => t.title.toLowerCase().includes(query)) : folderTasks;
    const visibleLinkTasks = query ? linkTasks.filter((t) => t.title.toLowerCase().includes(query)) : linkTasks;
    const isFiltering = query.length > 0;
    const hasAnyDeliverables = folderTasks.length > 0 || linkTasks.length > 0;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Deliverables: {project.name}
                </h2>
            </div>
        }>
            <Head title={`Deliverables - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6 lg:px-8">

                    <div ref={toolbarRef} className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-400 dark:text-gray-500">Files and links from completed tasks</p>
                        {hasAnyFiles && (
                            <a
                                href={route('projects.deliverables.download', project.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                Download all
                            </a>
                        )}
                    </div>

                    {hasAnyDeliverables && (
                        <SummaryStrip taskCount={tasksWithDeliverables} fileCount={totalFileCount} linkCount={totalLinkCount} />
                    )}

                    {(folderTasks.length + linkTasks.length > 1) && (
                        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by task name..." />
                    )}

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {folderTasks.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-14 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300 dark:bg-gray-900 dark:text-gray-600">
                                    <BoxIcon className="h-6 w-6" />
                                </div>
                                <p className="text-sm text-gray-400 dark:text-gray-500">No files yet. They'll show up here once tasks with attached files are marked done.</p>
                            </div>
                        ) : visibleFolderTasks.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">No file deliverables match "{search}".</p>
                            </div>
                        ) : (
                            visibleFolderTasks.map((task) => <TaskFolder key={task.id} task={task} onPreview={setPreviewingDeliverable} forceOpen={isFiltering} />)
                        )}
                    </div>

                    {linkTasks.length > 0 && visibleLinkTasks.length > 0 && (
                        <>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Links and documents</p>
                            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                {visibleLinkTasks.map((task) =>
                                    task.deliverables.filter((d) => d.type === 'link').map((d) => (
                                        <div key={d.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50/70 dark:border-gray-700 dark:hover:bg-gray-700/20">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                <LinkIcon className="h-3.5 w-3.5" />
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
        </AuthenticatedLayout>
    );
}
