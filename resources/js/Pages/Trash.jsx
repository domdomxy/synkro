import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import useConfirm from '@/hooks/useConfirm';

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

/** How many days remain before an item is purged for good, floored at 0 for anything already due. */
function daysLeft(graceEndsAt) {
    if (!graceEndsAt) return null;
    const ms = new Date(graceEndsAt) - new Date();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function GraceBadge({ graceEndsAt }) {
    const days = daysLeft(graceEndsAt);
    if (days === null) return null;

    return (
        <span className="text-xs text-gray-400 dark:text-gray-500">
            {days === 0 ? 'Purges today' : days === 1 ? 'Purges in 1 day' : `Purges in ${days} days`}
        </span>
    );
}

function TrashRow({ title, subtitle, graceEndsAt, onRestore, onDelete }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 last:border-0 dark:border-gray-700">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{title}</p>
                <div className="mt-0.5 flex items-center gap-2">
                    {subtitle && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
                    {subtitle && <span className="text-gray-300 dark:text-gray-600">·</span>}
                    <GraceBadge graceEndsAt={graceEndsAt} />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <button
                    type="button"
                    onClick={onRestore}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <UndoIcon />
                    Restore
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                    Delete forever
                </button>
            </div>
        </div>
    );
}

function EmptySection({ label }) {
    return (
        <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">{label}</div>
    );
}

export default function Trash({ trashedProjects, trashedTasks }) {
    const { confirm, ConfirmDialog } = useConfirm();

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

    return (
        <AuthenticatedLayout header={
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                <TrashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                Trash
            </h2>
        }>
            <Head title="Trash" />
            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Deleted projects and tasks sit here before they're gone for good. Only projects you own and tasks in projects you manage show up here.
                    </p>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Projects</h3>
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            {trashedProjects.length === 0 ? (
                                <EmptySection label="No deleted projects." />
                            ) : (
                                trashedProjects.map((project) => (
                                    <TrashRow
                                        key={project.id}
                                        title={project.name}
                                        subtitle={`${project.tasks_count} task${project.tasks_count === 1 ? '' : 's'}`}
                                        graceEndsAt={project.grace_ends_at}
                                        onRestore={() => restoreProject(project)}
                                        onDelete={() => deleteProjectForever(project)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Tasks</h3>
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            {trashedTasks.length === 0 ? (
                                <EmptySection label="No deleted tasks." />
                            ) : (
                                trashedTasks.map((task) => (
                                    <TrashRow
                                        key={task.id}
                                        title={task.title}
                                        subtitle={task.project_name}
                                        graceEndsAt={task.grace_ends_at}
                                        onRestore={() => restoreTask(task)}
                                        onDelete={() => deleteTaskForever(task)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {ConfirmDialog}
        </AuthenticatedLayout>
    );
}
