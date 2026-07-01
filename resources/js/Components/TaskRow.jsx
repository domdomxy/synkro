import Avatar from '@/Components/Avatar';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

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

export default function TaskRow({ task, currentUserId, canManage, canReview, isHighlighted, members }) {
    const isAssignee = task.assigned_to === currentUserId;

    const [isEditing, setIsEditing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const fileInputRef = useRef(null);
    const [showDeliverables, setShowDeliverables] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);

    const editForm = useForm({
        title: task.title,
        description: task.description ?? '',
        due_date: task.due_date ? task.due_date.slice(0, 19) : '',
        assigned_to: task.assigned_to ?? '',
    });
    const submitForm = useForm({ files: [], links: [] });
    const reviewForm = useForm({ feedback: '' });
    const commentForm = useForm({ body: '' });

    const startTask = () => router.patch(route('tasks.start', task.id));
    const startReview = () => router.patch(route('tasks.start-review', task.id));

    const saveEdit = (e) => {
        e.preventDefault();
        if (!confirm('Save changes to this task?')) return;
        editForm.patch(route('tasks.update', task.id), { onSuccess: () => setIsEditing(false) });
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
            onSuccess: () => {
                submitForm.reset();
                setShowAddPanel(false);
            },
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

    const submitComment = (e) => {
        e.preventDefault();
        commentForm.post(route('comments.store', task.id), { onSuccess: () => commentForm.reset() });
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
    const canEditDeliverables = isAssignee && task.status === 'submitted';

    return (
        <div
            id={`task-${task.id}`}
            className={`rounded-lg border bg-white p-4 shadow-sm transition dark:bg-gray-800 ${
                isHighlighted
                    ? 'border-indigo-400 ring-2 ring-indigo-400 dark:border-indigo-500 dark:ring-indigo-500'
                    : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            {isEditing ? (
                <form onSubmit={saveEdit} className="space-y-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950">
                    <div>
                        <InputLabel htmlFor={`title-${task.id}`} value="Title" />
                        <TextInput id={`title-${task.id}`} value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={editForm.errors.title} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor={`description-${task.id}`} value="Description" />
                        <textarea id={`description-${task.id}`} value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" rows={2} />
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
                        <PrimaryButton disabled={editForm.processing}>Save Changes</PrimaryButton>
                        <button type="button" onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="break-words font-medium text-gray-900 dark:text-gray-100">
                                {task.title}
                                {task.edited_at && <span className="ml-2 text-xs italic text-gray-400 dark:text-gray-500">(edited)</span>}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {task.assignee ? task.assignee.name : 'Unassigned'}
                                {task.due_date && ` · due ${formatDue(task.due_date)}`}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {task.status.replace('_', ' ')}
                            </span>
                            {canManage && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={deleteTask}
                                        className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/70"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {task.description && (
                        <div className="mt-1">
                            <p className={`break-words text-sm text-gray-600 dark:text-gray-400 ${!showFullDescription ? 'line-clamp-2' : ''}`}>
                                {task.description}
                            </p>
                            {task.description.length > 120 && (
                                <button
                                    onClick={() => setShowFullDescription((v) => !v)}
                                    className="mt-0.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
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
                                <SecondaryButton type="button" onClick={() => fileInputRef.current.click()}>
                                    Browse Files
                                </SecondaryButton>
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
                                <ul className="mt-3 space-y-1">
                                    {submitForm.data.files.map((file, i) => (
                                        <li key={`file-${i}`} className="flex items-center justify-between text-sm dark:text-gray-300">
                                            <span className="truncate">📎 {file.name}</span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:underline">remove</button>
                                        </li>
                                    ))}
                                    {submitForm.data.links.map((link, i) => (
                                        <li key={`link-${i}`} className="flex items-center justify-between text-sm dark:text-gray-300">
                                            <span className="truncate">🔗 {link}</span>
                                            <button type="button" onClick={() => removeLink(i)} className="text-red-500 hover:underline">remove</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-3 flex items-center gap-2">
                                <PrimaryButton disabled={submitForm.processing}>
                                    {task.status === 'submitted' ? 'Add More' : 'Submit Work'}
                                </PrimaryButton>
                                <button type="button" onClick={() => { setShowAddPanel(false); submitForm.reset(); }} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                    Cancel
                                </button>
                            </div>
                            <InputError message={submitForm.errors.files} className="mt-2" />
                        </form>
                    )}
                </div>
            )}

            {task.deliverables?.length > 0 && (
                <div className="mt-2">
                    <button onClick={() => setShowDeliverables((v) => !v)} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                        {showDeliverables ? 'Hide Submitted' : `View Submitted (${task.deliverables.length})`}
                    </button>
                    {showDeliverables && (
                        <div className="mt-2 space-y-1 rounded-md bg-gray-50 p-2 dark:bg-gray-900">
                            {task.deliverables.map((d) => (
                                <div key={d.id} className="flex items-center justify-between gap-2">
                                    <p className="break-words text-sm">
                                        {d.type === 'file' ? (
                                            <a href={`/storage/${d.path}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline dark:text-indigo-400">📎 {d.original_name}</a>
                                        ) : (
                                            <a href={d.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline dark:text-indigo-400">🔗 {d.url}</a>
                                        )}
                                    </p>
                                    {canEditDeliverables && (
                                        <button onClick={() => removeDeliverable(d.id)} className="shrink-0 text-xs text-red-500 hover:underline">remove</button>
                                    )}
                                </div>
                            ))}
                        </div>
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

            <div className="mt-3">
                <button onClick={() => setShowComments((v) => !v)} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                    {showComments ? 'Hide comments' : `Comments (${commentCount})`}
                </button>

                {showComments && (
                    <div className="mt-2 rounded-md bg-gray-50 p-3 dark:bg-gray-900">
                        <div className="space-y-3">
                            {task.comments?.map((comment) => (
                                <div key={comment.id} className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                        <Avatar user={comment.user} size="h-6 w-6" />
                                        <div className="min-w-0 text-sm">
                                            <p>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{comment.user.name}</span>
                                                {comment.is_feedback && (
                                                    <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                                        Tester Feedback
                                                    </span>
                                                )}
                                            </p>
                                            <p className="break-words text-gray-600 dark:text-gray-400">{comment.body}</p>
                                        </div>
                                    </div>
                                    {(comment.user.id === currentUserId || canManage) && (
                                        <button onClick={() => deleteComment(comment.id)} className="shrink-0 text-xs text-red-500 hover:underline">delete</button>
                                    )}
                                </div>
                            ))}
                            {commentCount === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet.</p>}
                        </div>
                        <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
                            <input
                                type="text"
                                value={commentForm.data.body}
                                onChange={(e) => commentForm.setData('body', e.target.value)}
                                placeholder="Add a comment..."
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <PrimaryButton disabled={commentForm.processing}>Send</PrimaryButton>
                        </form>
                        {commentForm.errors.body && <p className="mt-1 text-sm text-red-600">{commentForm.errors.body}</p>}
                    </div>
                )}
            </div>
            {!!task.pending_resolution && canManage && (
                <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        The person assigned to this task left or was removed while it was {task.status.replace('_', ' ')}. Keep the submission for review, or reset the task?
                    </p>
                    <div className="mt-2 flex gap-2">
                        <SecondaryButton
                            onClick={() => router.patch(route('tasks.resolve', task.id), { action: 'keep' })}
                        >
                            Keep Submission
                        </SecondaryButton>
                        <DangerButton
                            onClick={() => {
                                if (confirm('Reset this task?')) {
                                    router.patch(route('tasks.resolve', task.id), { action: 'reset' });
                                }
                            }}
                        >
                            Reset Task
                        </DangerButton>
                    </div>
                </div>
            )}
        </div>
    );
}