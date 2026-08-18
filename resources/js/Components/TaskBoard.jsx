import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
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
// left out on purpose rather than falling back to the raw admin status override - that's
// what was letting a drag-and-drop turn into an unreviewed, unannounced status jump.
const TRANSITIONS = {
    'todo->in_progress': { type: 'start', requires: 'start' },
    'submitted->in_review': { type: 'start-review', requires: 'review' },
    'in_review->done': { type: 'approve', requires: 'review' },
    'in_review->in_progress': { type: 'reject', requires: 'review' },
};

// Plain-language description of each entry in TRANSITIONS, used only by BoardLegendModal below.
const TRANSITION_DETAILS = {
    'todo->in_progress': { action: 'Starts the task.', who: 'Assignee or a manager' },
    'submitted->in_review': { action: 'Begins reviewing the submission.', who: 'A reviewer' },
    'in_review->done': { action: 'Approves the submission.', who: 'A reviewer' },
    'in_review->in_progress': { action: 'Sends it back for changes (feedback required).', who: 'A reviewer' },
};

const BLOCKED_MESSAGES = {
    'in_progress->submitted': 'Submitting needs a file or link attached - do that from the task card.',
    'in_progress->todo': "Moving a task back to To Do isn't supported from the board.",
    'submitted->todo': "Moving a task back to To Do isn't supported from the board.",
    'submitted->in_progress': 'Withdraw a submission from the task card instead.',
    'in_review->submitted': "That move isn't supported from the board.",
    'done->todo': 'Reopen a completed task from its card - reopening needs a reason.',
    'done->in_progress': 'Reopen a completed task from its card - reopening needs a reason.',
    'done->submitted': 'Reopen a completed task from its card - reopening needs a reason.',
    'done->in_review': 'Reopen a completed task from its card - reopening needs a reason.',
};

const LONG_PRESS_MS = 500;
// Finger has to stay roughly put for a hold to count - otherwise a scroll gesture
// down the column would get misread as a long-press partway through.
const LONG_PRESS_MOVE_TOLERANCE = 10;

function TaskCard({ task, draggable, onDragStart, onClick, onTouchDragStart, isTouchDragging }) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.todo;

    const cardRef = useRef(null);
    const pressTimer = useRef(null);
    const longPressFired = useRef(false);
    const touchStart = useRef(null);

    const clearPressTimer = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleTouchStart = (e) => {
        if (!draggable || !onTouchDragStart) return;
        longPressFired.current = false;
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
        pressTimer.current = setTimeout(() => {
            longPressFired.current = true;
            pressTimer.current = null;
            if (navigator.vibrate) navigator.vibrate(15);
            const rect = cardRef.current?.getBoundingClientRect();
            onTouchDragStart(task, touchStart.current, rect);
        }, LONG_PRESS_MS);
    };

    const handleTouchMove = (e) => {
        // Only relevant while we're still waiting for the hold to complete - once the
        // real drag has started, TaskBoard takes over via document-level listeners.
        if (!pressTimer.current || !touchStart.current) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStart.current.x);
        const dy = Math.abs(touch.clientY - touchStart.current.y);
        if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) clearPressTimer();
    };

    const handleTouchEnd = (e) => {
        clearPressTimer();
        // The long-press already acted; swallow the synthetic click that mobile
        // browsers fire right after touchend so it doesn't also open the task.
        if (longPressFired.current) {
            e.preventDefault();
        }
    };

    return (
        <div
            ref={cardRef}
            draggable={draggable}
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => {
                if (longPressFired.current) {
                    longPressFired.current = false;
                    return;
                }
                onClick(task);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={clearPressTimer}
            onContextMenu={(e) => { if (draggable && onTouchDragStart) e.preventDefault(); }}
            title={draggable ? (onTouchDragStart ? 'Drag on desktop, or press and hold then drag on touch' : undefined) : 'You can open this task, but only its assignee or a reviewer can drag it'}
            className={`group cursor-pointer touch-manipulation select-none rounded-lg border border-l-[3px] p-3 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.border} ${style.accent} ${style.bg} ${draggable ? 'active:cursor-grabbing active:translate-y-0 active:shadow-sm' : 'opacity-90'} ${isTouchDragging ? 'opacity-30' : ''}`}
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

// Reference card for what the board can do, shown from the info button above the columns.
// Exported so the page hosting <TaskBoard> can trigger it from its own modal header (e.g. next
// to the same close button that wraps the whole board), the same way Project Info works.
//
// Slides in from the right edge (same Dialog/DialogPanel/TransitionChild shape as
// AdminGuideDrawer) rather than opening as a centered Modal - it's reference material
// someone keeps glancing at while dragging cards around the board behind it, so a
// side panel that doesn't fully block the columns fits better than a one-off prompt
// stealing the center of the screen.
export function BoardLegendModal({ show, onClose }) {
    return (
        <Transition show={show} leave="duration-150">
            <Dialog as="div" className="fixed inset-0 z-[60]" onClose={onClose}>
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/55 dark:bg-black/70" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 right-0 flex max-w-full">
                        <TransitionChild
                            enter="transform transition ease-in-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in-out duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <DialogPanel className="w-screen max-w-md sm:max-w-lg">
                                <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
                                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">How Board Moves Work</h2>
                                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                Drag a card onto another column (or on touch, press and hold then drag) to trigger one of these moves.
                                            </p>
                                        </div>
                                        <button onClick={onClose} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-5">
                                        <div className="space-y-2.5">
                                            {Object.entries(TRANSITIONS).map(([key]) => {
                                                const [fromStatus, toStatus] = key.split('->');
                                                const fromCol = COLUMNS.find((c) => c.status === fromStatus);
                                                const toCol = COLUMNS.find((c) => c.status === toStatus);
                                                const details = TRANSITION_DETAILS[key];

                                                return (
                                                    <div key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[fromStatus]?.dot ?? STATUS_STYLES.todo.dot}`} />
                                                            {fromCol?.label}
                                                            <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                            </svg>
                                                            <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[toStatus]?.dot ?? STATUS_STYLES.todo.dot}`} />
                                                            {toCol?.label}
                                                        </div>
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{details?.action}</p>
                                                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                                            {details?.who}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                                            Any other move - submitting work, reopening a completed task, or moving something back to To Do -
                                            isn't available from the board. Open the task card for those.
                                        </p>
                                    </div>

                                    <div className="flex justify-end border-t border-gray-100 p-4 dark:border-gray-700">
                                        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

export default function TaskBoard({ tasks, canManage, canReview, isTrashed, currentUserId, projectId, onCardClick }) {
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [notice, setNotice] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null); // task pending a reject decision
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [rejectError, setRejectError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showLegend, setShowLegend] = useState(false);

    // Real touch drag state: dragSession holds the static info captured at the moment the hold
    // completes (which task, and where the finger sits relative to the card so the floating
    // ghost doesn't jump under the finger). dragPos is the live pointer position, updated on
    // every touchmove so the ghost tracks the finger; it's kept separate from dragSession so
    // the document-level listener effect below (keyed on dragSession) doesn't get torn down
    // and re-attached on every single move event.
    const [dragSession, setDragSession] = useState(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const dragPosRef = useRef({ x: 0, y: 0 });
    // The horizontally-scrolling columns row - used so a drag held near the left/right edge
    // can auto-scroll it to reveal offscreen columns, same as the desktop drag would let you
    // do by just moving the mouse there (browsers auto-scroll under native HTML5 DnD; touch
    // gets no such thing for free, and preventDefault() in handleMove below blocks manual
    // scroll attempts too, so without this a held edge does nothing at all).
    const boardScrollRef = useRef(null);

    const flash = (text) => {
        setNotice(text);
        window.clearTimeout(flash._t);
        flash._t = window.setTimeout(() => setNotice(null), 4000);
    };

    // A trashed project is frozen for everyone, assignee included - see
    // TaskPolicy::update()'s docblock on the backend for the matching enforcement.
    const canStartTask = (task) => !isTrashed && (canManage || task.assigned_to === currentUserId);

    const isDraggable = (task) => {
        if (task.status === 'todo') return canStartTask(task);
        if (task.status === 'submitted' || task.status === 'in_review') return !isTrashed && canReview;
        return false;
    };

    const handleDragStart = (e, task) => {
        if (!isDraggable(task)) {
            e.preventDefault();
            return;
        }
        setDraggedId(task.id);
        dragPosRef.current = { x: e.clientX, y: e.clientY };
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

    // Begins a real touch drag: called once the press-and-hold threshold in TaskCard fires.
    const startTouchDrag = (task, point, rect) => {
        if (!isDraggable(task) || processing || !rect) return;
        setDraggedId(task.id);
        dragPosRef.current = point;
        setDragPos(point);
        setDragSession({
            task,
            offsetX: point.x - rect.left,
            offsetY: point.y - rect.top,
            width: rect.width,
        });
    };

    // Document-level listeners so the drag keeps tracking the finger anywhere on screen, not
    // just while it stays over the card it started on (touch events don't re-target like that).
    // Keyed on dragSession (not dragPos) so this only attaches/detaches at drag start/end.
    useEffect(() => {
        if (!dragSession) return;

        const handleMove = (e) => {
            // Blocks the page from scrolling under the drag - requires passive: false below,
            // since browsers default touchmove listeners to passive (where preventDefault is a no-op).
            e.preventDefault();
            const touch = e.touches[0];
            if (!touch) return;
            const point = { x: touch.clientX, y: touch.clientY };
            dragPosRef.current = point;
            setDragPos(point);
            const el = document.elementFromPoint(point.x, point.y);
            const columnEl = el?.closest('[data-column-status]');
            setDragOverStatus(columnEl?.dataset.columnStatus ?? null);
        };

        const endDrag = (shouldDrop) => {
            if (shouldDrop) {
                const { x, y } = dragPosRef.current;
                const el = document.elementFromPoint(x, y);
                const columnEl = el?.closest('[data-column-status]');
                if (columnEl) {
                    handleDrop(columnEl.dataset.columnStatus);
                } else {
                    setDraggedId(null);
                    setDragOverStatus(null);
                }
            } else {
                setDraggedId(null);
                setDragOverStatus(null);
            }
            setDragSession(null);
        };

        const handleTouchEnd = () => endDrag(true);
        const handleTouchCancel = () => endDrag(false);

        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchCancel);

        return () => {
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchCancel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dragSession]);

    // Desktop counterpart to the touchmove tracker above: native HTML5 drag doesn't fire
    // regular mousemove events while dragging, it fires dragover instead - this just keeps
    // dragPosRef current for the edge auto-scroll loop below, no drop-target logic here
    // (that's already handled per-column by the existing onDragOver handlers).
    useEffect(() => {
        if (draggedId == null) return;

        const handleDragOverGlobal = (e) => {
            dragPosRef.current = { x: e.clientX, y: e.clientY };
        };

        document.addEventListener('dragover', handleDragOverGlobal);
        return () => document.removeEventListener('dragover', handleDragOverGlobal);
    }, [draggedId]);

    // Edge auto-scroll: runs every frame for as long as any drag is active - touch or desktop
    // - independent of whether a move event is currently firing (it won't be if the pointer is
    // held still at the edge), so holding there keeps scrolling instead of stalling after one
    // move event. Keyed on draggedId (set at the start of both drag paths) rather than
    // dragSession (touch-only) so desktop drags get the same smooth scrolling.
    useEffect(() => {
        if (draggedId == null) return;

        const EDGE_ZONE = 56; // px from the container's edge that starts auto-scroll
        const MAX_SPEED = 16; // px scrolled per frame right at the edge

        let rafId;
        const step = () => {
            const container = boardScrollRef.current;
            if (container) {
                const rect = container.getBoundingClientRect();
                const x = dragPosRef.current.x;
                let speed = 0;
                if (x < rect.left + EDGE_ZONE) {
                    speed = -MAX_SPEED * Math.min(1, (rect.left + EDGE_ZONE - x) / EDGE_ZONE);
                } else if (x > rect.right - EDGE_ZONE) {
                    speed = MAX_SPEED * Math.min(1, (x - (rect.right - EDGE_ZONE)) / EDGE_ZONE);
                }
                if (speed !== 0) container.scrollLeft += speed;
            }
            rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);

        return () => cancelAnimationFrame(rafId);
    }, [draggedId]);

    // Lets the mouse wheel scroll the board horizontally too, not just the scrollbar drag -
    // a plain vertical wheel gesture (deltaY, the normal case for a mouse) is redirected into
    // scrollLeft; a gesture that's already mostly horizontal (deltaX, e.g. a trackpad swipe)
    // is left alone so it keeps working natively. Only intercepts while the row actually has
    // overflow to scroll, so page scroll isn't hijacked once every column is visible.
    useEffect(() => {
        const container = boardScrollRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            if (container.scrollWidth <= container.clientWidth) return;
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

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

    const dragGhostStyle = dragSession ? STATUS_STYLES[dragSession.task.status] ?? STATUS_STYLES.todo : null;

    return (
        <div>
            <div className="mb-2 flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setShowLegend(true)}
                    title="How moves work"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {notice && (
                <div className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {notice}
                </div>
            )}
            <div ref={boardScrollRef} className="flex gap-3 overflow-x-auto pb-2">
                {COLUMNS.map((col) => {
                    const columnTasks = tasks.filter((t) => t.status === col.status);

                    const isDragTarget = dragOverStatus === col.status;

                    return (
                        <div
                            key={col.status}
                            data-column-status={col.status}
                            onDragOver={(e) => { if (draggedId != null) { e.preventDefault(); setDragOverStatus(col.status); } }}
                            onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                            onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
                            className={`flex w-64 shrink-0 flex-col rounded-xl border-2 border-dashed p-2 transition-all sm:w-72 lg:w-0 lg:shrink lg:flex-1 lg:min-w-[220px] ${
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
                                        onTouchDragStart={startTouchDrag}
                                        onClick={onCardClick}
                                        isTouchDragging={dragSession?.task.id === task.id}
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

            {dragSession && createPortal(
                <div
                    className={`pointer-events-none fixed z-[100] scale-105 rounded-lg border border-l-[3px] p-3 text-sm shadow-2xl ${dragGhostStyle.border} ${dragGhostStyle.accent} ${dragGhostStyle.bg}`}
                    style={{
                        left: dragPos.x - dragSession.offsetX,
                        top: dragPos.y - dragSession.offsetY,
                        width: dragSession.width,
                    }}
                >
                    <div className="flex items-start gap-1.5">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dragGhostStyle.dot}`} />
                        <p className="font-medium leading-snug text-gray-800 dark:text-gray-200 line-clamp-2">{dragSession.task.title}</p>
                    </div>
                </div>,
                document.body,
            )}

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

            <BoardLegendModal show={showLegend} onClose={() => setShowLegend(false)} />
        </div>
    );
}
