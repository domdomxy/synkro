import { useState } from 'react';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';
import AutoGrowTextarea from '@/Components/AutoGrowTextarea';

const COLUMNS = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'submitted', label: 'Submitted' },
    { status: 'in_review', label: 'In Review' },
    { status: 'done', label: 'Done' },
];

// Single source of truth for "what color is this status", used for the card border/background/
// dot here, the column header dot, and kept in sync with the status pill + left-border accent in
// TaskRow.jsx so a task reads as the same color everywhere in the app.
// - dot: small solid indicator (column header, card title)
// - accent: thicker left-edge border stripe, full-strength hue
// - border: thin border running around the whole card, a tint of the same hue (not just the left edge)
// - bg: background wash, a tint of the same hue
const STATUS_STYLES = {
    todo: {
        dot: 'bg-gray-400 dark:bg-gray-500',
        accent: 'border-l-gray-400 dark:border-l-gray-600',
        border: 'border-gray-200 dark:border-gray-700',
        bg: 'bg-white dark:bg-gray-800',
    },
    in_progress: {
        dot: 'bg-blue-500',
        accent: 'border-l-blue-500',
        border: 'border-blue-200 dark:border-blue-900',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    submitted: {
        dot: 'bg-yellow-500',
        accent: 'border-l-yellow-500',
        border: 'border-yellow-200 dark:border-yellow-900',
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    in_review: {
        dot: 'bg-purple-500',
        accent: 'border-l-purple-500',
        border: 'border-purple-200 dark:border-purple-900',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    done: {
        dot: 'bg-green-500',
        accent: 'border-l-green-500',
        border: 'border-green-200 dark:border-green-900',
        bg: 'bg-green-50 dark:bg-green-950/30',
    },
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
            className={`group cursor-pointer rounded-lg border border-l-[3px] p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.border} ${style.accent} ${style.bg} ${draggable ? 'active:cursor-grabbing active:translate-y-0 active:shadow-sm' : 'opacity-90'}`}
        >
            <div className="flex items-start gap-1.5">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                <p className="font-medium leading-snug text-gray-800 dark:text-gray-200 line-clamp-2">{task.title}</p>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    {task.priority === 'high' && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles.high}`}>
                            High
                        </span>
                    )}
                    {task.priority === 'low' && (
                        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityStyles.low}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                            Low
                        </span>
                    )}
                    {task.dependencies?.some((d) => d.status !== 'done') && (
                        <span
                            className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            title="Blocked by dependencies"
                        >
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                            </svg>
                            Blocked
                        </span>
                    )}
                </div>
                {task.assignee && <Avatar user={task.assignee} size="h-5 w-5" />}
            </div>
            {task.due_date && (
                <p className={`mt-1.5 flex items-center gap-1 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isOverdue ? 'Overdue ' : 'Due '}
                    {new Date(task.due_date).toLocaleDateString()}
                </p>
            )}
            {task.dependencies?.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-gray-100 pt-1.5 dark:border-gray-700/60">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Depends on
                    </p>
                    {task.dependencies.map((dep) => (
                        <div key={dep.id} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400" title={dep.title}>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dep.status === 'done' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="truncate">{dep.title}</span>
                        </div>
                    ))}
                </div>
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

                    const isDragTarget = dragOverStatus === col.status;

                    return (
                        <div
                            key={col.status}
                            onDragOver={(e) => { if (draggedId != null) { e.preventDefault(); setDragOverStatus(col.status); } }}
                            onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                            onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
                            className={`flex w-64 shrink-0 flex-col rounded-xl border-2 border-dashed p-2 transition-all ${
                                isDragTarget
                                    ? 'scale-[1.02] border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/40'
                            }`}
                        >
                            <div className="mb-2.5 flex items-center justify-between px-1.5 pt-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[col.status]?.dot ?? STATUS_STYLES.todo.dot}`} />
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{col.label}</h4>
                                </div>
                                <span className="rounded-full bg-gray-200/70 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                                    {columnTasks.length}
                                </span>
                            </div>
                            <div className="flex min-h-[4.5rem] flex-col gap-2">
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
                                    <div
                                        className={`flex flex-1 items-center justify-center rounded-lg px-2 py-4 text-center text-xs transition-colors ${
                                            isDragTarget
                                                ? 'text-indigo-400 dark:text-indigo-300'
                                                : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                    >
                                        {isDragTarget ? 'Drop here' : 'No tasks'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal show={!!rejectTarget} onClose={() => (processing ? null : setRejectTarget(null))} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
                <form onSubmit={submitReject} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send back for changes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Moving "{rejectTarget?.title}" back to In Progress. Let the assignee know what needs to change.
                    </p>
                    <AutoGrowTextarea
                        value={rejectFeedback}
                        onChange={(e) => setRejectFeedback(e.target.value)}
                        autoFocus
                        placeholder="Feedback (required)"
                        className="mt-3 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
