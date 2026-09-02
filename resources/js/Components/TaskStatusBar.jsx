// Simple project-completion indicator: how many of the project's tasks are
// done, as a single-color fill bar (not a multi-segment status breakdown -
// that read as noisy at a glance, so this keeps it to one number: percent
// done). Sits in the Tasks pane between the "Create New Task" control and
// the task list/board itself.
export default function TaskStatusBar({ tasks }) {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                    {done} of {total} {total === 1 ? 'task' : 'tasks'} done
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300 dark:bg-green-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
