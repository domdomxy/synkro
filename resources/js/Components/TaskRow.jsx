import Avatar from '@/Components/Avatar';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import RichTextEditor from '@/Components/RichTextEditor';
import { localDateTimeToIso } from '@/utils/datetime';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const statusStyles = {
    todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

function formatDue(dateString) {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function toDatetimeLocalValue(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function getExtension(name) {
    return name?.split('.').pop()?.toLowerCase() ?? '';
}

function FileTypeIcon({ name, className = 'h-4 w-4' }) {
    const ext = getExtension(name);

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }
    if (ext === 'pdf') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        );
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m3 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-9 4h14a2 2 0 002-2V7a2 2 0 00-2-2h-5.586a1 1 0 01-.707-.293L9.293 3.293A1 1 0 008.586 3H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function LinkTypeIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

function PinIcon({ filled, className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    );
}

function RemoveButton({ onClick, title = 'Remove' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );
}

function KebabMenu({ canManage, isPinned, isDone, onEdit, onDelete, onPin, onRequestChanges }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <button onClick={() => { setOpen(false); onPin(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        <PinIcon filled={isPinned} className="h-3.5 w-3.5" />
                        {isPinned ? 'Unpin task' : 'Pin task'}
                    </button>
                    {canManage && isDone && (
                        <button onClick={() => { setOpen(false); onRequestChanges(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-gray-700">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
                            </svg>
                            Request Changes
                        </button>
                    )}
                    {canManage && (
                        <>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                            <button onClick={() => { setOpen(false); onEdit(); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Edit</button>
                            <button onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">Delete</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TaskRow({ task, currentUserId, canManage, canReview, isHighlighted, members }) {
    const isAssignee = task.assigned_to === currentUserId;

    const [isEditing, setIsEditing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const fileInputRef = useRef(null);
    const [showDeliverables, setShowDeliverables] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [pinning, setPinning] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [showReopenPanel, setShowReopenPanel] = useState(false);

    const editForm = useForm({
        title: task.title,
        description: task.description ?? '',
        due_date: toDatetimeLocalValue(task.due_date),
        assigned_to: task.assigned_to ?? '',
    });
    const submitForm = useForm({ files: [], links: [] });
    const reviewForm = useForm({ feedback: '' });
    const commentForm = useForm({ body: '' });
    const editCommentForm = useForm({ body: '' });
    const reopenForm = useForm({ feedback: '' });

    const resolveKeepForm = useForm({ action: 'keep' });
    const resolveResetForm = useForm({ action: 'reset' });

    const startTask = () => router.patch(route('tasks.start', task.id));
    const startReview = () => router.patch(route('tasks.start-review', task.id));

    const togglePin = () => {
        setPinning(true);
        const routeName = task.is_pinned ? 'tasks.unpin' : 'tasks.pin';
        router.post(route(routeName, task.id), {}, {
            preserveScroll: true,
            onFinish: () => setPinning(false),
        });
    };

    const saveEdit = (e) => {
        e.preventDefault();
        if (!confirm('Save changes to this task?')) return;
        editForm
            .transform((data) => ({ ...data, due_date: localDateTimeToIso(data.due_date) }))
            .patch(route('tasks.update', task.id), {
                onSuccess: () => {
                    // Without this, isDirty stays true after a successful save (it's compared
                    // against the form's original mount-time defaults, which Inertia doesn't
                    // update automatically), so reopening edit right after saving would show
                    // Save Changes as active again with nothing new to save.
                    editForm.setDefaults();
                    setIsEditing(false);
                },
            });
    };

    const addFiles = (e) => {
        const newFiles = Array.from(e.target.files);
        submitForm.setData('files', [...submitForm.data.files, ...newFiles]);
        e.target.value = '';
    };

    const addLink = () => {
        if (!linkInput.trim()) return;
        submitForm.setData('links', [...submitForm.data.links, linkInput.trim()]);
        setLinkInput('');
    };

    const removeFile = (index) => submitForm.setData('files', submitForm.data.files.filter((_, i) => i !== index));
    const removeLink = (index) => submitForm.setData('links', submitForm.data.links.filter((_, i) => i !== index));

    const submitTask = (e) => {
        e.preventDefault();
        if (submitForm.data.files.length === 0 && submitForm.data.links.length === 0) {
            alert('Add at least one file or link first.');
            return;
        }
        const confirmMessage = task.status === 'submitted' ? 'Add these to your submission?' : 'Submit this work for review?';
        if (!confirm(confirmMessage)) return;
        submitForm.post(route('tasks.submit', task.id), {
            forceFormData: true,
            onSuccess: () => { submitForm.reset(); setShowAddPanel(false); },
        });
    };

    const removeDeliverable = (deliverableId) => {
        if (confirm('Remove this submitted item?')) {
            router.delete(route('deliverables.destroy', deliverableId));
        }
    };

    const sendReview = (decision) => {
        reviewForm.transform((data) => ({ ...data, decision }));
        reviewForm.post(route('tasks.review', task.id), { onSuccess: () => reviewForm.reset() });
    };

    const submitReopen = (e) => {
        e.preventDefault();
        if (!confirm('Send this task back for changes? It will move back to In Progress.')) return;
        reopenForm.post(route('tasks.reopen', task.id), {
            onSuccess: () => { reopenForm.reset(); setShowReopenPanel(false); },
        });
    };

    const submitComment = (e) => {
        e.preventDefault();
        commentForm.post(route('comments.store', task.id), { onSuccess: () => commentForm.reset() });
    };

    const startEditComment = (comment) => {
        setEditingCommentId(comment.id);
        editCommentForm.setData('body', comment.body);
    };

    const saveCommentEdit = (e, commentId) => {
        e.preventDefault();
        editCommentForm.patch(route('comments.update', commentId), {
            onSuccess: () => setEditingCommentId(null),
        });
    };

    const deleteComment = (commentId) => {
        if (confirm('Delete this comment?')) router.delete(route('comments.destroy', commentId));
    };

    const deleteTask = () => {
        if (confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
            router.delete(route('tasks.destroy', task.id));
        }
    };

    const commentCount = task.comments?.length ?? 0;
    const canEditDeliverables = isAssignee && ['in_progress', 'submitted'].includes(task.status);

    return (
        <div
            id={`task-${task.id}`}
            className={`rounded-lg border-l-4 bg-white shadow-sm transition dark:bg-gray-800 ${
                isHighlighted
                    ? 'border-l-indigo-500 ring-2 ring-indigo-400 dark:ring-indigo-500'
                    : task.status === 'todo' ? 'border-l-gray-400 dark:border-l-gray-600'
                    : task.status === 'in_progress' ? 'border-l-blue-500'
                    : task.status === 'submitted' ? 'border-l-yellow-500'
                    : task.status === 'in_review' ? 'border-l-purple-500'
                    : task.status === 'done' ? 'border-l-green-500'
                    : 'border-l-gray-400'
            }`}
        >
            <div className="p-4">
            {!!task.pending_resolution && canManage && (
                <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        The person assigned to this task left or was removed while it was {task.status.replace('_', ' ')}. Keep the submission for review, or reset the task?
                    </p>
                    <div className="mt-2 flex gap-2">
                        <SecondaryButton
                            disabled={resolveKeepForm.processing}
                            onClick={() => {
                                resolveKeepForm.patch(route('tasks.resolve', task.id), {
                                    onSuccess: () => window.location.reload(),
                                });
                            }}
                        >
                            Keep Submission
                        </SecondaryButton>
                        <DangerButton
                            disabled={resolveResetForm.processing}
                            onClick={() => {
                                if (confirm('Reset this task? The submission and deliverables will be cleared.')) {
                                    resolveResetForm.patch(route('tasks.resolve', task.id), {
                                        replace: true,
                                        onSuccess: () => window.location.reload(),
                                    });
                                }
                            }}
                        >
                            Reset Task
                        </DangerButton>
                    </div>
                </div>
            )}

            {isEditing ? (
                <form onSubmit={saveEdit} className="space-y-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950">
                    <div>
                        <InputLabel htmlFor={`title-${task.id}`} value="Title" />
                        <TextInput id={`title-${task.id}`} value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={editForm.errors.title} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor={`description-${task.id}`} value="Description" />
                        <RichTextEditor
                            value={editForm.data.description}
                            onChange={(html) => editForm.setData('description', html)}
                            rows={2}
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor={`assigned-${task.id}`} value="Assign To" />
                        <select
                            id={`assigned-${task.id}`}
                            value={editForm.data.assigned_to}
                            onChange={(e) => editForm.setData('assigned_to', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            <option value="">Unassigned</option>
                            {members?.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <InputError message={editForm.errors.assigned_to} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor={`due-${task.id}`} value="Due Date & Time" />
                        <TextInput id={`due-${task.id}`} type="datetime-local" step="1" value={editForm.data.due_date} onChange={(e) => editForm.setData('due_date', e.target.value)} className="mt-1 block w-full" />
                    </div>
                    <div className="flex gap-2">
                        <PrimaryButton disabled={editForm.processing || !editForm.isDirty} title={!editForm.isDirty ? 'No changes to save' : undefined}>Save Changes</PrimaryButton>
                        <button type="button" onClick={() => { editForm.reset(); setIsEditing(false); }} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                {task.assignee && <Avatar user={task.assignee} size="h-5 w-5" />}
                                <p className="break-words font-semibold text-gray-900 dark:text-gray-100">
                                    {task.title}
                                    {task.edited_at && <span className="ml-2 text-xs italic font-normal text-gray-400 dark:text-gray-500">(edited)</span>}
                                </p>
                                {task.is_pinned && (
                                    <PinIcon filled className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {!task.assignee && <span>Unassigned</span>}
                                {task.assignee && <span>{task.assignee.name}</span>}
                                {task.due_date && (
                                    <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : ''}`}>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {formatDue(task.due_date)}
                                    </span>
                                )}
                                {task.comments?.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {task.comments.length}
                                    </span>
                                )}
                                {task.deliverables?.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        {task.deliverables.length} file{task.deliverables.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {task.status.replace('_', ' ')}
                            </span>
                            <KebabMenu
                                canManage={canManage}
                                isPinned={!!task.is_pinned}
                                isDone={task.status === 'done'}
                                onEdit={() => setIsEditing(true)}
                                onDelete={deleteTask}
                                onPin={togglePin}
                                onRequestChanges={() => setShowReopenPanel(true)}
                            />
                        </div>
                    </div>
                    {task.description && (
                        <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                            <div
                                className={`prose-sm max-w-none whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100 ${!showFullDescription ? 'line-clamp-2' : ''}`}
                                style={{ tabSize: 4 }}
                                dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                            {task.description.replace(/<[^>]*>/g, '').length > 120 && (
                                <button onClick={() => setShowFullDescription((v) => !v)} className="mt-0.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                    {showFullDescription ? 'Show Less' : 'View Full Description'}
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {!isEditing && isAssignee && task.status === 'todo' && (
                <div className="mt-2">
                    <SecondaryButton onClick={startTask}>Start Task</SecondaryButton>
                </div>
            )}

            {!isEditing && isAssignee && ['in_progress', 'submitted'].includes(task.status) && (
                <div className="mt-3">
                    {!showAddPanel && submitForm.data.files.length === 0 && submitForm.data.links.length === 0 && (
                        <SecondaryButton type="button" onClick={() => setShowAddPanel(true)}>
                            Add files or links
                        </SecondaryButton>
                    )}
                    {(showAddPanel || submitForm.data.files.length > 0 || submitForm.data.links.length > 0) && (
                        <form onSubmit={submitTask} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-2">
                                <input ref={fileInputRef} type="file" multiple onChange={addFiles} className="hidden" />
                                <SecondaryButton type="button" onClick={() => fileInputRef.current.click()}>Browse Files</SecondaryButton>
                                <input
                                    type="url"
                                    value={linkInput}
                                    onChange={(e) => setLinkInput(e.target.value)}
                                    placeholder="Paste a link..."
                                    className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                                <SecondaryButton type="button" onClick={addLink}>Add Link</SecondaryButton>
                            </div>
                            {(submitForm.data.files.length > 0 || submitForm.data.links.length > 0) && (
                                <ul className="mt-3 space-y-1.5">
                                    {submitForm.data.files.map((file, i) => (
                                        <li key={`file-${i}`} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                                            <FileTypeIcon name={file.name} className="h-4 w-4 shrink-0 text-gray-400" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-gray-700 dark:text-gray-300">{file.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(file.size)}</p>
                                            </div>
                                            <RemoveButton onClick={() => removeFile(i)} />
                                        </li>
                                    ))}
                                    {submitForm.data.links.map((link, i) => (
                                        <li key={`link-${i}`} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                                            <LinkTypeIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                            <p className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{link}</p>
                                            <RemoveButton onClick={() => removeLink(i)} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {submitForm.progress && (
                                <div className="mt-3">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                        <div
                                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                            style={{ width: `${submitForm.progress.percentage}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Uploading... {submitForm.progress.percentage}%</p>
                                </div>
                            )}
                            <div className="mt-3 flex items-center gap-2">
                                <PrimaryButton disabled={submitForm.processing}>
                                    {submitForm.progress ? `Uploading ${submitForm.progress.percentage}%` : task.status === 'submitted' ? 'Add More' : 'Submit Work'}
                                </PrimaryButton>
                                <button type="button" disabled={submitForm.processing} onClick={() => { setShowAddPanel(false); submitForm.reset(); }} className="text-sm text-gray-500 hover:underline disabled:opacity-50 dark:text-gray-400">Cancel</button>
                            </div>
                            <InputError message={submitForm.errors.files} className="mt-2" />
                        </form>
                    )}
                </div>
            )}

            {task.deliverables?.length > 0 && (
                <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowDeliverables((v) => !v)}
                            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {showDeliverables ? 'Hide Submitted' : 'Submitted'}
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                                {task.deliverables.length}
                            </span>
                            <svg className={`h-3 w-3 transition-transform ${showDeliverables ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {task.updated_at && ['submitted', 'in_review', 'done'].includes(task.status) && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Last Submission update {formatDue(task.updated_at)}
                            </span>
                        )}
                        {task.deliverables?.some((d) => d.type === 'file') && (
                            <a
                                href={route('tasks.download', task.id)}
                                className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Download ZIP
                            </a>
                        )}
                    </div>
                    {showDeliverables && (
                        <ul className="mt-2 space-y-1.5">
                            {task.deliverables.map((d) => (
                                <li key={d.id} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                                    {d.type === 'file' ? (
                                        <FileTypeIcon name={d.original_name} className="h-4 w-4 shrink-0 text-gray-400" />
                                    ) : (
                                        <LinkTypeIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {d.type === 'file' ? (
                                            <a
                                                href={`/storage/${d.path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                                                title={d.original_name}
                                            >
                                                {d.original_name}
                                            </a>
                                        ) : (
                                            <a
                                                href={d.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block truncate text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                                                title={d.url}
                                            >
                                                {d.url}
                                            </a>
                                        )}
                                        {d.size != null && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(d.size)}</p>
                                        )}
                                    </div>
                                    {canEditDeliverables && (
                                        <RemoveButton onClick={() => removeDeliverable(d.id)} />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {!isEditing && canReview && task.status === 'submitted' && (
                <div className="mt-2">
                    <SecondaryButton onClick={startReview}>Start Review</SecondaryButton>
                </div>
            )}

            {!isEditing && canReview && task.status === 'in_review' && (
                <div className="mt-3 space-y-2 rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                    <textarea
                        value={reviewForm.data.feedback}
                        onChange={(e) => reviewForm.setData('feedback', e.target.value)}
                        placeholder="Feedback (required if rejecting)"
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        rows={2}
                    />
                    <InputError message={reviewForm.errors.feedback} className="mt-1" />
                    <div className="flex gap-2">
                        <PrimaryButton disabled={reviewForm.processing} onClick={() => sendReview('approve')}>Approve</PrimaryButton>
                        <DangerButton disabled={reviewForm.processing} onClick={() => sendReview('reject')}>Reject</DangerButton>
                    </div>
                </div>
            )}

            {!isEditing && canManage && task.status === 'done' && showReopenPanel && (
                <div className="mt-3">
                    <form onSubmit={submitReopen} className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-gray-600 dark:bg-gray-700/40">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            This will move the task back to In Progress, keeping its existing submission and history. The assignee can then update it without starting over.
                        </p>
                        <textarea
                            value={reopenForm.data.feedback}
                            onChange={(e) => reopenForm.setData('feedback', e.target.value)}
                            placeholder="What needs to change?"
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            rows={2}
                        />
                        <InputError message={reopenForm.errors.feedback} className="mt-1" />
                        <div className="flex gap-2">
                            <PrimaryButton disabled={reopenForm.processing}>Send Back for Changes</PrimaryButton>
                            <button type="button" onClick={() => setShowReopenPanel(false)} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                <button
                    onClick={() => setShowComments((v) => !v)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {commentCount === 0 ? 'Add a comment' : `${commentCount} comment${commentCount > 1 ? 's' : ''}`}
                    <svg className={`h-3.5 w-3.5 transition-transform ${showComments ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showComments && (
                    <div className="mt-3 space-y-3">
                        {task.comments?.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2.5">
                                <Avatar user={comment.user} size="h-7 w-7" className="mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    {editingCommentId === comment.id ? (
                                        <form onSubmit={(e) => saveCommentEdit(e, comment.id)} className="space-y-1.5">
                                            <textarea
                                                value={editCommentForm.data.body}
                                                onChange={(e) => editCommentForm.setData('body', e.target.value)}
                                                rows={2}
                                                autoFocus
                                                className="block w-full rounded-lg border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            />
                                            {editCommentForm.errors.body && <p className="text-xs text-red-500">{editCommentForm.errors.body}</p>}
                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={editCommentForm.processing}
                                                    className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="text-xs text-gray-500 hover:underline dark:text-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className={`rounded-2xl px-3.5 py-2 ${
                                                comment.is_feedback
                                                    ? 'bg-purple-50 dark:bg-purple-950/30'
                                                    : 'bg-gray-100 dark:bg-gray-700/60'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{comment.user.name}</span>
                                                    {!!comment.is_feedback && (
                                                        <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                                            Tester Feedback
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100">{comment.body}</p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 px-1">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                    {timeAgo(comment.created_at)}
                                                    {comment.edited_at && ' · edited'}
                                                </span>
                                                {comment.user.id === currentUserId && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                                        <button
                                                            onClick={() => startEditComment(comment)}
                                                            className="text-[11px] font-medium text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                                                        >
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                                {(comment.user.id === currentUserId || canManage) && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                                        <button
                                                            onClick={() => deleteComment(comment.id)}
                                                            className="text-[11px] font-medium text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {commentCount === 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet. Be the first to say something.</p>
                        )}

                        <form onSubmit={submitComment} className="flex items-start gap-2.5 pt-1">
                            <div className="min-w-0 flex-1">
                                <input
                                    type="text"
                                    value={commentForm.data.body}
                                    onChange={(e) => commentForm.setData('body', e.target.value)}
                                    placeholder="Write a comment..."
                                    className="block w-full rounded-full border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                                {commentForm.errors.body && <p className="mt-1 px-2 text-xs text-red-500">{commentForm.errors.body}</p>}
                            </div>
                            <button
                                tyfpe="submit"
                                disabled={commentForm.processing || !commentForm.data.body.trim()}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}