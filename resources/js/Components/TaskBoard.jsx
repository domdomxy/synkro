import { useState } from 'react';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';

const COLUMNS = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'submitted', label: 'Submitted' },
    { status: 'in_review', label: 'In Review' },
    { status: 'done', label: 'Done' },
];

const priorityStyles = {
    low: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

function TaskCard({ task, draggable, onDragStart, onClick }) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

    return (
        <div
            draggable={draggable}
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onClick(task)}
            className={`cursor-pointer rounded-md border border-gray-200 bg-white p-3 text-sm shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${draggable ? 'active:cursor-grabbing' : ''}`}
        >
            <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{task.title}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    {task.priority && task.priority !== 'medium' && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles[task.priority] ?? priorityStyles.medium}`}>
                            {task.priority === 'high' ? 'High' : 'Low'}
                        </span>
                    )}
                    {task.dependencies?.some((d) => d.status !== 'done') && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300" title="Blocked by dependencies">
                            Blocked
                        </span>
                    )}
                </div>
                {task.assignee && <Avatar user={task.assignee} size="h-5 w-5" />}
            </div>
            {task.due_date && (
                <p className={`mt-1.5 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    Due {new Date(task.due_date).toLocaleDateString()}
                </p>
            )}
        </div>
    );
}

export default function TaskBoard({ tasks, canManage, projectId, onCardClick }) {
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);

    const handleDragStart = (e, task) => {
        setDraggedId(task.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (status) => {
        if (draggedId == null) return;
        const task = tasks.find((t) => t.id === draggedId);
        setDraggedId(null);
        setDragOverStatus(null);

        if (!task || task.status === status) return;

        router.post(route('tasks.bulk', projectId), {
            task_ids: [task.id],
            action: 'status',
            status,
        }, { preserveScroll: true });
    };

    return (
        <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.status);

                return (
                    <div
                        key={col.status}
                        onDragOver={(e) => { if (canManage) { e.preventDefault(); setDragOverStatus(col.status); } }}
                        onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                        onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
                        className={`flex w-64 shrink-0 flex-col rounded-lg border-2 border-dashed p-2 transition-colors ${
                            dragOverStatus === col.status
                                ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950'
                                : 'border-transparent bg-gray-50 dark:bg-gray-900/40'
                        }`}
                    >
                        <div className="mb-2 flex items-center justify-between px-1">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{col.label}</h4>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{columnTasks.length}</span>
                        </div>
                        <div className="flex min-h-[2rem] flex-col gap-2">
                            {columnTasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    draggable={canManage}
                                    onDragStart={handleDragStart}
                                    onClick={onCardClick}
                                />
                            ))}
                            {columnTasks.length === 0 && (
                                <p className="px-1 text-xs text-gray-300 dark:text-gray-600">No tasks</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
