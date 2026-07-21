import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

function FolderIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function FileIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

function formatSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TaskFolder({ task }) {
    const [open, setOpen] = useState(true);
    const files = task.deliverables.filter((d) => d.type === 'file');
    if (files.length === 0) return null;

    return (
        <div className="border-b border-gray-100 last:border-0 dark:border-gray-700">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
                <ChevronIcon open={open} />
                <FolderIcon className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{task.title}</span>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{files.length} file{files.length > 1 ? 's' : ''}</span>
            </button>
            {open && (
                <div className="pb-1.5 pl-11">
                    {files.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 py-1 text-sm text-gray-600 dark:text-gray-400">
                            <FileIcon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{f.original_name}</span>
                            {formatSize(f.size) && <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{formatSize(f.size)}</span>}
                        </div>
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
                <div className="mx-auto max-w-4xl space-y-6 sm:px-6 lg:px-8">

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-400 dark:text-gray-500">Files and links from completed tasks</p>
                        {hasAnyFiles && (
                            <a
                                href={route('projects.deliverables.download', project.id)}
                                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Download all
                            </a>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {folderTasks.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">No files yet. They'll show up here once tasks with attached files are marked done.</p>
                            </div>
                        ) : (
                            folderTasks.map((task) => <TaskFolder key={task.id} task={task} />)
                        )}
                    </div>

                    {linkTasks.length > 0 && (
                        <>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Links and documents</p>
                            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                {linkTasks.map((task) =>
                                    task.deliverables.filter((d) => d.type === 'link').map((d) => (
                                        <div key={d.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-700">
                                            <LinkIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                                            <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{task.title}</span>
                                            <a
                                                href={d.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                                                style={{ maxWidth: '220px' }}
                                            >
                                                {d.url}
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
