// Project-completion indicator: a segmented bar showing every status's share
// of the project's tasks (not just done vs. not-done), plus a small legend
// with per-status counts. Sits in the Tasks pane between the "Create New
// Task" control and the task list/board itself.

// Kept as its own local copy rather than importing Show.jsx's statusPillStyles,
// matching this codebase's existing pattern of each file owning its status/
// priority color maps (see Show.jsx's statusPillStyles, TaskRow.jsx's
// priorityStyles). Bar/legend dot colors use solid shades from the same hue
// family as those pill backgrounds so the two stay visually paired.
const STATUS_META = [
    { value: 'todo', label: 'To Do', bar: 'bg-gray-400 dark:bg-gray-500', dot: 'bg-gray-400 dark:bg-gray-500' },
    { value: 'in_progress', label: 'In Progress', bar: 'bg-blue-500', dot: 'bg-blue-500' },
    { value: 'submitted', label: 'Submitted', bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
    { value: 'in_review', label: 'In Review', bar: 'bg-purple-500', dot: 'bg-purple-500' },
    { value: 'done', label: 'Done', bar: 'bg-green-500', dot: 'bg-green-500' },
];

export default function TaskStatusBar({ tasks }) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    const counts = STATUS_META.map((meta) => ({
        ...meta,
        count: tasks.filter((t) => t.status === meta.value).length,
    }));

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {done} of {total} {total === 1 ? 'task' : 'tasks'} done
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">{percent}%</span>
            </div>

            {total === 0 ? (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" />
            ) : (
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    {counts
                        .filter((s) => s.count > 0)
                        .map((s) => (
                            <div
                                key={s.value}
                                className={`h-full ${s.bar} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                                style={{ width: `${(s.count / total) * 100}%` }}
                                title={`${s.label}: ${s.count}`}
                            />
                        ))}
                </div>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {counts.map((s) => (
                    <span key={s.value} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                        {s.label}
                        <span className="font-medium text-gray-700 dark:text-gray-300">{s.count}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
