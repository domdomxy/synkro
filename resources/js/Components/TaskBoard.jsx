import { useState } from 'react';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';

const COLUMNS = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'submitted', label: 'Submitted' },
    { status: 'in_review', label: 'In Review' },
    { status: 'done', label: 'Done' },
];

// Same palette used for the status pill/left-border accent in TaskRow.jsx, kept in sync
// so a task looks the same color whether you're looking at the list or the board.
const STATUS_STYLES = {
    todo: { border: 'border-l-gray-400 dark:border-l-gray-600', bg: 'bg-white dark:bg-gray-800' },
    in_progress: { border: 'border-l-blue-500', bg: 'bg-blue-50/70 dark:bg-blue-950/20' },
    submitted: { border: 'border-l-yellow-500', bg: 'bg-yellow-50/70 dark:bg-yellow-950/20' },
    in_review: { border: 'border-l-purple-500', bg: 'bg-purple-50/70 dark:bg-purple-950/20' },
    done: { border: 'border-l-green-500', bg: 'bg-green-50/70 dark:bg-green-950/20' },
};

const priorityStyles = {
    low: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// What the board is willing to do when a card is dropped on another column, keyed by
// "fromStatus->toStatus". Anything not listed here isn't a single, unambiguous action
// (or needs input the board can't collect in a drag, like uploaded deliverables), so it's
// left out on purpose rather than falling back to the raw admin status override — that's
// what was letting a drag-and-drop turn into an unreviewed, unannounced status jump.
const TRANSITIONS = {
    'todo->in_progress': { type: 'start', requires: 'start' },
    'submitted->in_review': { type: 'start-review', requires: 'review' },
    'in_review->done': { type: 'approve', requires: 'review' },
    'in_review->in_progress': { type: 'reject', requires: 'review' },
};

const BLOCKED_MESSAGES = {
    'in_progress->submitted': 'Submitting needs a file or link attached — do that from the task card.',
    'in_progress->todo': "Moving a task back to To Do isn't supported from the board.",
    'submitted->todo': "Moving a task back to To Do isn't supported from the board.",
    'submitted->in_progress': 'Withdraw a submission from the task card instead.',
    'in_review->submitted': "That move isn't supported from the board.",
    'done->todo': 'Reopen a completed task from its card — reopening needs a reason.',
    'done->in_progress': 'Reopen a completed task from its card — reopening needs a reason.',
    'done->submitted': 'Reopen a completed task from its card — reopening needs a reason.',
    'done->in_review': 'Reopen a completed task from its card — reopening needs a reason.',
};

function TaskCard({ task, draggable, onDragStart, onClick }) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.todo;

    return (
        <div
            draggable={draggable}
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onClick(task)}
            title={draggable ? undefined : 'You can open this task, but only its assignee or a reviewer can drag it'}
            className={`cursor-pointer rounded-md border border-l-4 border-gray-200 p-3 text-sm shadow-sm transition hover:shadow-md dark:border-gray-700 ${style.border} ${style.bg} ${draggable ? 'active:cursor-grabbing' : 'opacity-90'}`}
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

export default function TaskBoard({ tasks, canManage, canReview, currentUserId, projectId, onCardClick }) {
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [notice, setNotice] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null); // task pending a reject decision
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [rejectError, setRejectError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const flash = (text) => {
        setNotice(text);
        window.clearTimeout(flash._t);
        flash._t = window.setTimeout(() => setNotice(null), 4000);
    };

    const canStartTask = (task) => canManage || task.assigned_to === currentUserId;

    const isDraggable = (task) => {
        if (task.status === 'todo') return canStartTask(task);
        if (task.status === 'submitted' || task.status === 'in_review') return canReview;
        return false;
    };

    const handleDragStart = (e, task) => {
        if (!isDraggable(task)) {
            e.preventDefault();
            return;
        }
        setDraggedId(task.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const runTransition = (task, toStatus) => {
        const key = `${task.status}->${toStatus}`;
        const transition = TRANSITIONS[key];

        if (!transition) {
            flash(BLOCKED_MESSAGES[key] ?? "That move isn't supported from the board.");
            return;
        }

        const permitted = transition.requires === 'review' ? canReview : canStartTask(task);
        if (!permitted) {
            flash("You don't have permission to make that change.");
            return;
        }

        if (transition.type === 'start' && task.dependencies?.some((d) => d.status !== 'done')) {
            flash('This task is blocked by unfinished dependencies.');
            return;
        }

        if (transition.type === 'reject') {
            setRejectTarget(task);
            setRejectFeedback('');
            setRejectError(null);
            return;
        }

        setProcessing(true);
        if (transition.type === 'start') {
            router.patch(route('tasks.start', task.id), {}, { preserveScroll: true, onFinish: () => setProcessing(false) });
        } else if (transition.type === 'start-review') {
            router.patch(route('tasks.start-review', task.id), {}, { preserveScroll: true, onFinish: () => setProcessing(false) });
        } else if (transition.type === 'approve') {
            router.post(route('tasks.review', task.id), { decision: 'approve' }, { preserveScroll: true, onFinish: () => setProcessing(false) });
        }
    };

    const handleDrop = (status) => {
        if (draggedId == null) return;
        const task = tasks.find((t) => t.id === draggedId);
        setDraggedId(null);
        setDragOverStatus(null);

        if (!task || task.status === status) return;

        runTransition(task, status);
    };

    const submitReject = (e) => {
        e.preventDefault();
        if (!rejectFeedback.trim()) {
            setRejectError('Feedback is required when rejecting a submission.');
            return;
        }

        setProcessing(true);
        router.post(route('tasks.review', rejectTarget.id), {
            decision: 'reject',
            feedback: rejectFeedback,
        }, {
            preserveScroll: true,
            onSuccess: () => setRejectTarget(null),
            onError: (errs) => setRejectError(errs.feedback ?? 'Could not send that back.'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div>
            {notice && (
                <div className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {notice}
                </div>
            )}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {COLUMNS.map((col) => {
                    const columnTasks = tasks.filter((t) => t.status === col.status);

                    return (
                        <div
                            key={col.status}
                            onDragOver={(e) => { if (draggedId != null) { e.preventDefault(); setDragOverStatus(col.status); } }}
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
                                        draggable={isDraggable(task) && !processing}
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

            <Modal show={!!rejectTarget} onClose={() => (processing ? null : setRejectTarget(null))} maxWidth="md">
                <form onSubmit={submitReject} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send back for changes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Moving "{rejectTarget?.title}" back to In Progress. Let the assignee know what needs to change.
                    </p>
                    <textarea
                        value={rejectFeedback}
                        onChange={(e) => setRejectFeedback(e.target.value)}
                        rows={4}
                        autoFocus
                        placeholder="Feedback (required)"
                        className="mt-3 block w-full rounded-lg border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    {rejectError && <InputError message={rejectError} className="mt-1" />}
                    <div className="mt-4 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={() => setRejectTarget(null)} disabled={processing}>Cancel</SecondaryButton>
                        <DangerButton type="submit" disabled={processing}>Send back</DangerButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
