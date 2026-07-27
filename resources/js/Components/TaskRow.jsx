import Avatar from '@/Components/Avatar';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import RichTextEditor from '@/Components/RichTextEditor';
import RichTextContent from '@/Components/RichTextContent';
import MentionTextarea, { extractRoleMentions, ROLE_LABELS } from '@/Components/MentionTextarea';
import { localDateTimeToIso } from '@/utils/datetime';
import useConfirm from '@/hooks/useConfirm';
import Linkify from '@/Components/Linkify';
import CommentBody from '@/Components/CommentBody';
import AutoGrowTextarea from '@/Components/AutoGrowTextarea';
import LogEntryRow from '@/Components/LogEntryRow';
import Modal from '@/Components/Modal';
import FilterSelect from '@/Components/FilterSelect';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const statusStyles = {
    todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const priorityStyles = {
    low: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_OPTIONS = Object.entries(priorityLabels).map(([value, label]) => ({ value, label }));

/**
 * Mirrors TaskDependencyController::wouldCreateCycle on the backend: would making
 * `taskId` depend on `candidateId` create a cycle? True if `candidateId`, directly or
 * transitively (via its own dependencies), already depends on `taskId`. Used to hide
 * cycle-causing options from the picker up front instead of letting the person pick
 * one and only find out from a server error.
 */
function wouldCreateCycle(allTasks, taskId, candidateId) {
    const byId = new Map(allTasks.map((t) => [t.id, t]));
    const visited = new Set();
    const queue = [candidateId];

    while (queue.length) {
        const currentId = queue.shift();
        if (currentId === taskId) return true;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        (byId.get(currentId)?.dependencies ?? []).forEach((d) => queue.push(d.id));
    }

    return false;
}

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

// Strips mention/link tokens down to their plain label for a short quoted
// preview (e.g. of a reply's parent comment), then truncates to length.
function truncate(raw, length) {
    const plain = (raw ?? '')
        .replace(/@\[([^\]]+)\]\((?:user:\d+|role:[a-z]+)\)/g, '@$1')
        .replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    return plain.length > length ? plain.slice(0, length).trimEnd() + '…' : plain;
}

// Builds a real parent -> children tree from the flat comments array, so
// replies can be nested under their exact direct parent at any depth
// (Reddit-style), rather than flattened to one indented tier. A comment
// whose parent_id points at nothing we have (parent deleted) is promoted
// to a root so it still renders, and its parent_id is preserved so the UI
// can show a "replying to a deleted comment" note for it.
function buildCommentTree(comments) {
    const list = comments ?? [];
    const byId = new Map(list.map((c) => [c.id, c]));
    const childrenByParent = new Map();
    const roots = [];

    list.forEach((comment) => {
        if (comment.parent_id && byId.has(comment.parent_id)) {
            if (!childrenByParent.has(comment.parent_id)) childrenByParent.set(comment.parent_id, []);
            childrenByParent.get(comment.parent_id).push(comment);
        } else {
            roots.push(comment);
        }
    });

    return { roots, childrenByParent, byId };
}

// Total number of replies nested (at any depth) under a comment - shown in
// the collapsed summary line, e.g. "3 replies hidden".
function countDescendants(commentId, childrenByParent) {
    const kids = childrenByParent.get(commentId) ?? [];
    return kids.reduce((sum, kid) => sum + 1 + countDescendants(kid.id, childrenByParent), 0);
}

function getExtension(name) {
    return name?.split('.').pop()?.toLowerCase() ?? '';
}

function FileTypeIcon({ name, className = 'h-4 w-4' }) {
    const ext = getExtension(name);
    const base = name?.replace(/\.[^./]+$/, '') ?? '';
    const isReadme = /^readme$/i.test(base);

    if (isReadme || ['md', 'markdown'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.5c-1.6-1-4.2-1.4-6-1v12.5c1.8-.4 4.4 0 6 1 1.6-1 4.2-1.4 6-1V5.5c-1.8-.4-4.4 0-6 1z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5v12.5" />
            </svg>
        );
    }
    if (['ppt', 'pptx', 'key', 'odp'].includes(ext)) {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM8 20h8m-4-4v4"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 8.3l4 2.7-4 2.7V8.3z" />
            </svg>
        );
    }
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

function DeliverableItem({ d, canRemove, onRemove }) {
    return (
        <li className="flex items-center gap-2 rounded-md bg-white p-2 dark:bg-gray-800">
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
                        {d.title || d.url}
                    </a>
                )}
                {d.size != null && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(d.size)}</p>
                )}
            </div>
            {canRemove && <RemoveButton onClick={onRemove} />}
        </li>
    );
}

function KebabMenu({ canManage, canViewHistory, isPinned, isDone, onEdit, onDelete, onPin, onRequestChanges, onShowHistory }) {
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
                    {canViewHistory && (
                        <button onClick={() => { setOpen(false); onShowHistory(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View History
                        </button>
                    )}
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

function FooterToggle({ icon, label, count, active, onClick, variant = 'default' }) {
    const isWarning = variant === 'warning';
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                isWarning
                    ? active
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950'
                    : active
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }`}
        >
            {icon}
            <span>{label}</span>
            {count != null && (
                <span
                    className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${
                        isWarning
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                            : active
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

// Renders a single comment (top-level or reply). Replies are drawn indented,
// with a connecting line + curve on the left that runs up to the avatar of
// the comment they're replying to - there's no dedicated collapse button;
// clicking the comment itself toggles its thread open/closed.
function CommentEntry({
    comment,
    isReply,
    quoteParent,
    isCollapsed,
    descendantCount,
    onToggleCollapse,
    highlightedCommentId,
    editingCommentId,
    editCommentForm,
    currentUserId,
    canManage,
    members,
    onSaveEdit,
    onStartEdit,
    onCancelEdit,
    onDelete,
    onStartReply,
    onScrollToComment,
}) {
    const isDeleted = !!comment.is_deleted;

    return (
        <div id={`comment-${comment.id}`} className={`relative flex items-start gap-2 ${isReply ? 'pt-3' : ''}`}>
            {isReply && (
                <span
                    aria-hidden="true"
                    className="absolute -left-4 top-0 h-7 w-4 rounded-bl-2xl border-b-2 border-l-2 border-gray-200 dark:border-gray-700"
                />
            )}
            <Avatar user={comment.user} size="h-7 w-7" className={`mt-0.5 shrink-0 ${isDeleted ? 'opacity-40 grayscale' : ''}`} />
            <div className="min-w-0 flex-1">
                {isDeleted && !isCollapsed ? (
                    <>
                        <div
                            onClick={onToggleCollapse}
                            title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
                            className="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-dashed border-gray-300 px-3.5 py-2 text-sm italic text-gray-400 transition hover:border-gray-400 dark:border-gray-600 dark:text-gray-500 dark:hover:border-gray-500"
                        >
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
                            </svg>
                            Original comment was deleted
                        </div>
                        <div className="mt-1 flex items-center gap-2 px-1">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(comment.created_at)}</span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <button
                                onClick={() => onStartReply(comment)}
                                className="text-[11px] font-medium text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                            >
                                Reply
                            </button>
                        </div>
                    </>
                ) : editingCommentId === comment.id ? (
                    <form onSubmit={(e) => onSaveEdit(e, comment.id)} className="space-y-1.5">
                        <MentionTextarea
                            value={editCommentForm.data.body}
                            onChange={(val) => editCommentForm.setData('body', val)}
                            members={members}
                            canMentionEveryone={canManage}
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
                                onClick={onCancelEdit}
                                className="text-xs text-gray-500 hover:underline dark:text-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : isCollapsed ? (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="flex items-center gap-1.5 py-1 text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                    >
                        <span className="font-medium text-gray-700 dark:text-gray-300">{comment.user.name}</span>
                        <span>{descendantCount > 0 ? `${descendantCount} repl${descendantCount === 1 ? 'y' : 'ies'} hidden` : 'comment collapsed'}</span>
                    </button>
                ) : (
                    <>
                        {/* Only shown for a reply whose parent was deleted - real nesting
                            already makes a direct reply-to-parent relationship obvious. */}
                        {quoteParent !== undefined && (
                            <button
                                type="button"
                                onClick={() => quoteParent && onScrollToComment(quoteParent.id)}
                                disabled={!quoteParent}
                                className="mb-0.5 flex items-center gap-1 px-1 text-[11px] text-gray-400 hover:text-indigo-600 disabled:hover:text-gray-400 dark:text-gray-500 dark:hover:text-indigo-400"
                            >
                                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17L4 12m0 0l5-5m-5 5h11a4 4 0 004-4V7" />
                                </svg>
                                {quoteParent && !quoteParent.is_deleted ? (
                                    <span className="truncate">
                                        Replying to <span className="font-medium">{quoteParent.user.name}</span>: {truncate(quoteParent.body, 60)}
                                    </span>
                                ) : (
                                    <span className="italic">Replying to a deleted comment</span>
                                )}
                            </button>
                        )}
                        {/* Clicking the comment itself (not a separate +/- control)
                            collapses or expands its thread. */}
                        <div
                            onClick={onToggleCollapse}
                            title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
                            className={`cursor-pointer rounded-2xl px-3.5 py-2 transition hover:brightness-95 dark:hover:brightness-110 ${
                            highlightedCommentId === comment.id
                                ? 'ring-2 ring-indigo-400 dark:ring-indigo-500'
                                : ''
                        } ${
                            comment.is_reopened
                                ? 'bg-orange-50 dark:bg-orange-950/30'
                                : comment.is_rejection
                                ? 'bg-amber-50 dark:bg-amber-950/30'
                                : comment.is_feedback
                                ? 'bg-green-50 dark:bg-green-950/30'
                                : 'bg-gray-100 dark:bg-gray-700/60'
                        }`}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {comment.user.name}
                                </span>
                                {!!comment.is_reopened && (
                                    <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                        Reopened
                                    </span>
                                )}
                                {!!comment.is_rejection && !comment.is_reopened && (
                                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                        Requested changes
                                    </span>
                                )}
                                {!!comment.is_feedback && !comment.is_rejection && !comment.is_reopened && (
                                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                                        Review note
                                    </span>
                                )}
                            </div>
                            <CommentBody text={comment.body} />
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
                                        onClick={() => onStartEdit(comment)}
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
                                        onClick={() => onDelete(comment.id)}
                                        className="text-[11px] font-medium text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <button
                                onClick={() => onStartReply(comment)}
                                className="text-[11px] font-medium text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                            >
                                Reply
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Recursively renders one comment plus its full reply tree beneath it,
// indented one notch deeper at every level (Reddit-style, not flattened).
// When this comment is the active reply target, the shared composer is
// rendered as the last item in its children column - directly under its
// existing replies, or immediately under itself if it has none yet.
function CommentThread({
    comment,
    isReply,
    childrenByParent,
    byId,
    collapsedIds,
    onToggleCollapse,
    replyingToId,
    composer,
    highlightedCommentId,
    editingCommentId,
    editCommentForm,
    currentUserId,
    canManage,
    members,
    onSaveEdit,
    onStartEdit,
    onCancelEdit,
    onDelete,
    onStartReply,
    onScrollToComment,
}) {
    const children = childrenByParent.get(comment.id) ?? [];
    const isCollapsed = collapsedIds.has(comment.id);
    const isReplyingHere = replyingToId === comment.id;
    // A quote line only makes sense for a comment whose parent was deleted
    // (it lost its real nesting spot); a properly nested reply doesn't need
    // one since its position in the tree already shows who it's replying to.
    const quoteParent = !isReply && comment.parent_id ? (byId.get(comment.parent_id) ?? null) : undefined;

    return (
        <div>
            <CommentEntry
                comment={comment}
                isReply={isReply}
                quoteParent={quoteParent}
                isCollapsed={isCollapsed}
                descendantCount={countDescendants(comment.id, childrenByParent)}
                onToggleCollapse={() => onToggleCollapse(comment.id)}
                highlightedCommentId={highlightedCommentId}
                editingCommentId={editingCommentId}
                editCommentForm={editCommentForm}
                currentUserId={currentUserId}
                canManage={canManage}
                members={members}
                onSaveEdit={onSaveEdit}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onDelete={onDelete}
                onStartReply={onStartReply}
                onScrollToComment={onScrollToComment}
            />
            {/* This rail starts right where the comment above ends, so it reads
                as running straight down from that comment's avatar into each
                reply's own elbow connector (see CommentEntry) rather than
                floating disconnected from what it's replying to. */}
            {!isCollapsed && (children.length > 0 || isReplyingHere) && (
                <div className="ml-3.5 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                    {children.map((child) => (
                        <CommentThread
                            key={child.id}
                            comment={child}
                            isReply
                            childrenByParent={childrenByParent}
                            byId={byId}
                            collapsedIds={collapsedIds}
                            onToggleCollapse={onToggleCollapse}
                            replyingToId={replyingToId}
                            composer={composer}
                            highlightedCommentId={highlightedCommentId}
                            editingCommentId={editingCommentId}
                            editCommentForm={editCommentForm}
                            currentUserId={currentUserId}
                            canManage={canManage}
                            members={members}
                            onSaveEdit={onSaveEdit}
                            onStartEdit={onStartEdit}
                            onCancelEdit={onCancelEdit}
                            onDelete={onDelete}
                            onStartReply={onStartReply}
                            onScrollToComment={onScrollToComment}
                        />
                    ))}
                    {isReplyingHere && (
                        <div className="relative pt-3">
                            <span
                                aria-hidden="true"
                                className="absolute -left-4 top-0 h-9 w-4 rounded-bl-2xl border-b-2 border-l-2 border-gray-200 dark:border-gray-700"
                            />
                            {composer}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TaskRow({ task, currentUserId, canManage, canReview, isHighlighted, members, selectable = false, selected = false, onToggleSelect, allTasks = [], autoOpenHistory = false, autoOpenCommentId = null, onJumpToTask }) {
    const isAssignee = task.assigned_to === currentUserId;

    const [isEditing, setIsEditing] = useState(false);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [linkTitleInput, setLinkTitleInput] = useState('');
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);
    const [isDraggingFiles, setIsDraggingFiles] = useState(false);
    const [showDeliverables, setShowDeliverables] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const descriptionRef = useRef(null);
    // Whether the description is actually being clipped by line-clamp-2 right now.
    // Measured from real layout (scrollHeight vs clientHeight) instead of a raw
    // character count, since a short description can still wrap onto more than 2
    // visual lines (long unbroken word, narrow column, etc) and a character count
    // can't tell that apart from a short description that fits fine.
    const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
    const [pinning, setPinning] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null); // comment object being replied to, or null
    const [collapsedIds, setCollapsedIds] = useState(() => new Set()); // ids of comments whose thread is minimized
    const [showReopenPanel, setShowReopenPanel] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [dependencyPick, setDependencyPick] = useState('');
    const { confirm, ConfirmDialog } = useConfirm();

    // Re-measure whenever the description is collapsed (line-clamp-2 is only
    // ever active then) or its content changes. When expanded, clientHeight
    // grows to match scrollHeight so there's nothing meaningful to measure -
    // isDescriptionTruncated just keeps its last known collapsed-state value,
    // which is exactly what's needed to keep the "Show Less" button visible.
    useEffect(() => {
        if (showFullDescription || !descriptionRef.current) return;
        const el = descriptionRef.current;
        setIsDescriptionTruncated(el.scrollHeight > el.clientHeight + 1);
    }, [task.description, showFullDescription]);

    // Comments / Checklist share one expandable area below the task — only one is
    // shown at a time so the row doesn't stack multiple open panels.
    const [activeSection, setActiveSection] = useState(null);
    const toggleSection = (section) => setActiveSection((v) => (v === section ? null : section));
    const showComments = activeSection === 'comments';
    const showChecklist = activeSection === 'checklist';
    const showDependencies = activeSection === 'dependencies';

    useEffect(() => {
        if (autoOpenHistory) setShowHistory(true);
    }, [autoOpenHistory]);

    const [highlightedCommentId, setHighlightedCommentId] = useState(null);

    // A comment/mention notification or email links to ?task=X&comment=Y. If this
    // is that task and it still has that comment, open the comments panel (it's
    // collapsed by default) and scroll straight to it, instead of just landing on
    // the task and leaving the person to scroll through the whole thread.
    useEffect(() => {
        if (!autoOpenCommentId || !task.comments?.some((c) => c.id === autoOpenCommentId)) return;
        setActiveSection('comments');
        setHighlightedCommentId(autoOpenCommentId);
        const scrollTimer = setTimeout(() => {
            document.getElementById(`comment-${autoOpenCommentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
        const clearTimer = setTimeout(() => setHighlightedCommentId(null), 3000);
        return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, [autoOpenCommentId, task.comments]);

    const assigneeStillMember = task.assigned_to != null && members?.some((m) => m.id === task.assigned_to);

    const deliverableFiles = task.deliverables?.filter((d) => d.type === 'file') ?? [];
    const deliverableLinks = task.deliverables?.filter((d) => d.type === 'link') ?? [];

    const editForm = useForm({
        title: task.title,
        description: task.description ?? '',
        due_date: toDatetimeLocalValue(task.due_date),
        assigned_to: task.assigned_to ?? '',
        priority: task.priority ?? 'medium',
    });
    const checklistForm = useForm({ title: '' });
    const submitForm = useForm({ files: [], links: [] });
    const reviewForm = useForm({ feedback: '' });
    const commentForm = useForm({ body: '', parent_id: null });
    const editCommentForm = useForm({ body: '' });
    const reopenForm = useForm({ feedback: '' });

    const resolveKeepForm = useForm({ action: 'keep' });
    const resolveResetForm = useForm({ action: 'reset' });

    const startTask = () => router.patch(route('tasks.start', task.id), {}, { preserveScroll: true });
    const startReview = () => router.patch(route('tasks.start-review', task.id), {}, { preserveScroll: true });

    const togglePin = () => {
        setPinning(true);
        const routeName = task.is_pinned ? 'tasks.unpin' : 'tasks.pin';
        router.post(route(routeName, task.id), {}, {
            preserveScroll: true,
            onFinish: () => setPinning(false),
        });
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!(await confirm('Save changes to this task?', { title: 'Save Changes?' }))) return;
        editForm.transform((data) => ({ ...data, due_date: localDateTimeToIso(data.due_date) }));
        editForm.patch(route('tasks.update', task.id), {
            preserveScroll: true,
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

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        setIsDraggingFiles(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current = Math.max(0, dragCounter.current - 1);
        if (dragCounter.current === 0) setIsDraggingFiles(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDraggingFiles(false);
        const dropped = Array.from(e.dataTransfer.files ?? []);
        if (dropped.length > 0) submitForm.setData('files', [...submitForm.data.files, ...dropped]);
    };

    const addChecklistItem = (e) => {
        e.preventDefault();
        if (!checklistForm.data.title.trim()) return;
        checklistForm.post(route('checklist.store', task.id), {
            preserveScroll: true,
            onSuccess: () => checklistForm.reset('title'),
        });
    };

    const toggleChecklistItem = (item) => {
        router.patch(route('checklist.update', item.id), { done: !item.done }, { preserveScroll: true });
    };

    const deleteChecklistItem = (item) => {
        router.delete(route('checklist.destroy', item.id), { preserveScroll: true });
    };

    const addDependency = () => {
        if (!dependencyPick) return;
        router.post(route('dependencies.store', task.id), { depends_on_task_id: dependencyPick }, {
            preserveScroll: true,
            onSuccess: () => setDependencyPick(''),
        });
    };

    const removeDependency = (dependsOnTaskId) => {
        router.delete(route('dependencies.destroy', [task.id, dependsOnTaskId]), { preserveScroll: true });
    };

    const addLink = () => {
        if (!linkInput.trim()) return;
        submitForm.setData('links', [
            ...submitForm.data.links,
            { url: linkInput.trim(), title: linkTitleInput.trim() },
        ]);
        setLinkInput('');
        setLinkTitleInput('');
    };

    const removeFile = (index) => submitForm.setData('files', submitForm.data.files.filter((_, i) => i !== index));
    const removeLink = (index) => submitForm.setData('links', submitForm.data.links.filter((_, i) => i !== index));

    const submitTask = async (e) => {
        e.preventDefault();
        if (submitForm.data.files.length === 0 && submitForm.data.links.length === 0) {
            alert('Add at least one file or link first.');
            return;
        }
        const confirmTitle = task.status === 'submitted' ? 'Add to Submission?' : 'Submit for Review?';
        const confirmMessage = task.status === 'submitted' ? 'Add these to your submission?' : 'Submit this work for review?';
        if (!(await confirm(confirmMessage, { title: confirmTitle }))) return;
        submitForm.post(route('tasks.submit', task.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => { submitForm.reset(); setShowAddPanel(false); },
        });
    };

    const removeDeliverable = async (deliverableId) => {
        if (await confirm('Remove this submitted item?', { title: 'Remove Item?', danger: true, confirmLabel: 'Remove' })) {
            router.delete(route('deliverables.destroy', deliverableId), { preserveScroll: true });
        }
    };

    const sendReview = (decision) => {
        reviewForm.transform((data) => ({ ...data, decision }));
        reviewForm.post(route('tasks.review', task.id), { preserveScroll: true, onSuccess: () => reviewForm.reset() });
    };

    const submitReopen = async (e) => {
        e.preventDefault();
        if (!(await confirm('It will move back to In Progress.', { title: 'Send Back for Changes?' }))) return;
        reopenForm.post(route('tasks.reopen', task.id), {
            preserveScroll: true,
            onSuccess: () => { reopenForm.reset(); setShowReopenPanel(false); },
        });
    };

    // A role mention (@managers, @everyone, ...) notifies a whole group at
    // once rather than a single person, so it's confirmed before sending -
    // same reasoning as any other bulk/irreversible action in this app.
    const confirmRoleMentions = async (body) => {
        const roles = extractRoleMentions(body);
        if (roles.length === 0) return true;
        const labels = roles.map((r) => ROLE_LABELS[r] ?? r);
        const message = roles.includes('everyone')
            ? 'This will notify every member of this project.'
            : `This will notify all ${labels.join(' and ')} on this project.`;
        return confirm(message, { title: 'Notify a whole role?', confirmLabel: 'Send' });
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!(await confirmRoleMentions(commentForm.data.body))) return;
        commentForm.post(route('comments.store', task.id), {
            preserveScroll: true,
            onSuccess: () => { commentForm.reset(); setReplyingTo(null); },
        });
    };

    const startReply = (comment) => {
        setEditingCommentId(null);
        setReplyingTo(comment);
        commentForm.setData('parent_id', comment.id);
    };

    const cancelReply = () => {
        setReplyingTo(null);
        commentForm.setData('parent_id', null);
    };

    const toggleCommentCollapse = (commentId) => {
        setCollapsedIds((current) => {
            const next = new Set(current);
            if (next.has(commentId)) next.delete(commentId);
            else next.add(commentId);
            return next;
        });
    };

    const startEditComment = (comment) => {
        setEditingCommentId(comment.id);
        editCommentForm.setData('body', comment.body);
    };

    const saveCommentEdit = async (e, commentId) => {
        e.preventDefault();
        if (!(await confirmRoleMentions(editCommentForm.data.body))) return;
        editCommentForm.patch(route('comments.update', commentId), {
            preserveScroll: true,
            onSuccess: () => setEditingCommentId(null),
        });
    };

    const deleteComment = async (commentId) => {
        if (await confirm('Delete this comment?', { title: 'Delete Comment?', danger: true, confirmLabel: 'Delete' })) router.delete(route('comments.destroy', commentId), { preserveScroll: true });
    };

    // Jumps to and briefly highlights a comment already in view (used by the
    // "Replying to ..." quote line) - same highlight mechanism the
    // notification-driven autoOpenCommentId effect above uses.
    const scrollToComment = (commentId) => {
        setHighlightedCommentId(commentId);
        document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => setHighlightedCommentId((id) => (id === commentId ? null : id)), 2000);
    };

    const deleteTask = async () => {
        if (await confirm(`"${task.title}" will be permanently deleted. This cannot be undone.`, { title: 'Delete Task?', danger: true, confirmLabel: 'Delete' })) {
            router.delete(route('tasks.destroy', task.id), { preserveScroll: true });
        }
    };

    const commentCount = task.comments?.length ?? 0;
    const commentTree = buildCommentTree(task.comments);

    // Single shared compose box: rendered at the bottom of the list when
    // starting a fresh top-level comment, or inline inside a thread (right
    // after its existing replies, or immediately below it if it's the first
    // reply) when replyingTo is set.
    const commentComposer = (
        <form onSubmit={submitComment} className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
                {replyingTo && (
                    <div className="mb-1.5 flex items-center gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate text-gray-400 dark:text-gray-500">
                            Replying to <span className="font-medium text-gray-600 dark:text-gray-300">{replyingTo.user.name}</span>
                        </span>
                        <button
                            type="button"
                            onClick={cancelReply}
                            className="shrink-0 font-medium text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <MentionTextarea
                    value={commentForm.data.body}
                    onChange={(val) => commentForm.setData('body', val)}
                    members={members}
                    canMentionEveryone={canManage}
                    autoFocus={!!replyingTo}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (commentForm.data.body.trim()) submitComment(e);
                        }
                        if (e.key === 'Escape' && replyingTo) cancelReply();
                    }}
                    placeholder={replyingTo ? `Reply to ${replyingTo.user.name}...` : 'Write a comment... (@ to mention someone)'}
                    title="Tip: [label](url) turns into a clickable link, @ to mention someone or a role"
                    className="block w-full rounded-2xl border-gray-300 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
                {commentForm.errors.body && <p className="mt-1 px-2 text-xs text-red-500">{commentForm.errors.body}</p>}
            </div>
            <button
                type="submit"
                disabled={commentForm.processing || !commentForm.data.body.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            </button>
        </form>
    );
    const dependencyCount = task.dependencies?.length ?? 0;
    const dependenciesBlocked = task.dependencies?.some((d) => d.status !== 'done') ?? false;
    const canEditDeliverables = isAssignee && ['in_progress', 'submitted'].includes(task.status);

    return (
        <div
            id={`task-${task.id}`}
            className={`relative rounded-lg border-l-4 bg-white shadow-sm transition dark:bg-gray-800 ${
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
                            onClick={async () => {
                                if (await confirm('The submission and deliverables will be cleared.', { title: 'Reset Task?', danger: true, confirmLabel: 'Reset' })) {
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
                        <FilterSelect
                            id={`assigned-${task.id}`}
                            className="mt-1"
                            value={editForm.data.assigned_to}
                            onChange={(v) => editForm.setData('assigned_to', v)}
                            options={[
                                { value: '', label: 'Unassigned' },
                                ...(!assigneeStillMember && task.assigned_to != null
                                    ? [{
                                        value: task.assigned_to,
                                        label: `${task.assignee_name ?? task.assignee?.name ?? 'Former member'} (no longer a member — pick someone else or Unassigned)`,
                                        disabled: true,
                                    }]
                                    : []),
                                ...(members?.map((m) => ({ value: m.id, label: m.name })) ?? []),
                            ]}
                        />
                        <InputError message={editForm.errors.assigned_to} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor={`due-${task.id}`} value="Due Date & Time" />
                        <TextInput id={`due-${task.id}`} type="datetime-local" step="1" value={editForm.data.due_date} onChange={(e) => editForm.setData('due_date', e.target.value)} className="mt-1 block w-full" />
                    </div>
                    <div>
                        <InputLabel htmlFor={`priority-${task.id}`} value="Priority" />
                        <FilterSelect id={`priority-${task.id}`} className="mt-1" value={editForm.data.priority} onChange={(v) => editForm.setData('priority', v)} options={PRIORITY_OPTIONS} />
                        <InputError message={editForm.errors.priority} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value="Dependencies" />
                        <div className="mt-1 space-y-2 rounded-md border border-indigo-100 bg-white p-2.5 dark:border-indigo-900 dark:bg-gray-900/40">
                            {(!task.dependencies || task.dependencies.length === 0) && (
                                <p className="text-sm text-gray-400 dark:text-gray-500">This task doesn't depend on anything.</p>
                            )}
                            {task.dependencies?.map((dep) => (
                                <div key={dep.id} className="flex items-center gap-2 text-sm group">
                                    <button
                                        type="button"
                                        onClick={() => onJumpToTask?.(dep.id)}
                                        title={`Go to "${dep.title}"`}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 text-left transition hover:text-indigo-600 dark:hover:text-indigo-400"
                                    >
                                        <span className={`h-2 w-2 shrink-0 rounded-full ${dep.status === 'done' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                        <span className="min-w-0 flex-1 truncate text-gray-700 group-hover:underline dark:text-gray-300">{dep.title}</span>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusStyles[dep.status] ?? 'bg-gray-100 text-gray-600'}`}>{dep.status.replace('_', ' ')}</span>
                                    </button>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() => removeDependency(dep.id)}
                                            className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-red-500 transition-opacity"
                                            title="Remove dependency"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {canManage && (
                                <div className="flex items-center gap-2 pt-1">
                                    <FilterSelect
                                        value={dependencyPick}
                                        onChange={setDependencyPick}
                                        options={[
                                            { value: '', label: 'Add a dependency…' },
                                            ...allTasks
                                                .filter((t) => t.id !== task.id && !task.dependencies?.some((d) => d.id === t.id) && !wouldCreateCycle(allTasks, task.id, t.id))
                                                .map((t) => ({ value: t.id, label: t.title })),
                                        ]}
                                    />
                                    <SecondaryButton type="button" onClick={addDependency} disabled={!dependencyPick}>Add</SecondaryButton>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <PrimaryButton disabled={editForm.processing || !editForm.isDirty} title={!editForm.isDirty ? 'No changes to save' : undefined}>Save Changes</PrimaryButton>
                        <button type="button" onClick={() => { editForm.reset(); setIsEditing(false); }} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="flex items-start gap-2">
                        {selectable && (
                            <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => onToggleSelect?.(task.id)}
                                aria-label={`Select "${task.title}"`}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                            />
                        )}
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
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
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {task.priority && task.priority !== 'medium' && (
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority] ?? priorityStyles.medium}`}>
                                        {priorityLabels[task.priority] ?? task.priority}
                                    </span>
                                )}
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                <KebabMenu
                                    canManage={canManage}
                                    canViewHistory={!!task.can_view_history}
                                    isPinned={!!task.is_pinned}
                                    isDone={task.status === 'done'}
                                    onEdit={() => setIsEditing(true)}
                                    onDelete={deleteTask}
                                    onPin={togglePin}
                                    onRequestChanges={() => setShowReopenPanel(true)}
                                    onShowHistory={() => setShowHistory(true)}
                                />
                            </div>
                        </div>
                    </div>
                    {task.description && (
                        <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
                            <RichTextContent
                                ref={descriptionRef}
                                onClick={isDescriptionTruncated ? (e) => {
                                    // Let links inside the description (Linkify/Linkifier-generated
                                    // <a> tags) behave normally instead of toggling the expand state.
                                    if (e.target.closest('a')) return;
                                    setShowFullDescription((v) => !v);
                                } : undefined}
                                onKeyDown={isDescriptionTruncated ? (e) => {
                                    if (e.key !== 'Enter' && e.key !== ' ') return;
                                    e.preventDefault();
                                    setShowFullDescription((v) => !v);
                                } : undefined}
                                role={isDescriptionTruncated ? 'button' : undefined}
                                tabIndex={isDescriptionTruncated ? 0 : undefined}
                                aria-expanded={isDescriptionTruncated ? showFullDescription : undefined}
                                title={isDescriptionTruncated ? (showFullDescription ? 'Click to collapse' : 'Click to expand') : undefined}
                                className={`prose-sm max-w-none whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100 ${!showFullDescription ? 'line-clamp-2' : ''} ${
                                    isDescriptionTruncated ? '-mx-1.5 -my-0.5 cursor-pointer rounded-md px-1.5 py-0.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/40' : ''
                                }`}
                                style={{ tabSize: 4 }}
                                html={task.description}
                            />
                            {isDescriptionTruncated && (
                                <div className="mt-0.5 flex justify-end">
                                    <span className="flex select-none items-center gap-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                        {showFullDescription ? 'Click to collapse' : 'Click to expand'}
                                        <svg
                                            className={`h-3 w-3 transition-transform ${showFullDescription ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {!isEditing && isAssignee && task.status === 'todo' && (
                <div className="mt-2">
                    {task.dependencies?.some((d) => d.status !== 'done') ? (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Blocked by:{' '}
                            {task.dependencies.filter((d) => d.status !== 'done').map((d, i, arr) => (
                                <span key={d.id}>
                                    <button
                                        type="button"
                                        onClick={() => onJumpToTask?.(d.id)}
                                        className="underline decoration-amber-400/60 underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
                                    >
                                        {d.title}
                                    </button>
                                    {i < arr.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </p>
                    ) : (
                        <SecondaryButton onClick={startTask}>Start Task</SecondaryButton>
                    )}
                </div>
            )}

            {!isEditing && isAssignee && ['in_progress', 'submitted'].includes(task.status) && (
                <div className="mt-3">
                    {!showAddPanel && submitForm.data.files.length === 0 && submitForm.data.links.length === 0 && (
                        <button
                            type="button"
                            onClick={() => setShowAddPanel(true)}
                            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add files or links
                        </button>
                    )}
                    {(showAddPanel || submitForm.data.files.length > 0 || submitForm.data.links.length > 0) && (
                        <form
                            onSubmit={submitTask}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`rounded-md border-2 border-dashed p-3 transition ${
                                isDraggingFiles
                                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-900/40'
                            }`}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <input ref={fileInputRef} type="file" multiple onChange={addFiles} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    Browse Files
                                </button>
                                <div className="flex min-w-[260px] flex-1 items-center gap-1 rounded-md bg-white pl-2.5 pr-1 shadow-sm dark:bg-gray-800">
                                    <input
                                        type="text"
                                        value={linkTitleInput}
                                        onChange={(e) => setLinkTitleInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                        placeholder="Title (optional)"
                                        className="w-28 shrink-0 border-0 border-r border-gray-100 bg-transparent p-0 py-1.5 pr-2 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-0 dark:border-gray-700 dark:text-gray-300"
                                    />
                                    <input
                                        type="url"
                                        value={linkInput}
                                        onChange={(e) => setLinkInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                        placeholder="Paste a link..."
                                        className="flex-1 border-0 bg-transparent p-0 py-1.5 pl-2 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-0 dark:text-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={addLink}
                                        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                                    >
                                        Add
                                    </button>
                                </div>
                                <p className="w-full text-[11px] text-gray-400 dark:text-gray-500">or drag and drop files anywhere in this box</p>
                            </div>
                            {(submitForm.data.files.length > 0 || submitForm.data.links.length > 0) && (
                                <div className="mt-2.5">
                                    {task.deliverables?.length > 0 && (
                                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">New</p>
                                    )}
                                    <ul className="space-y-1">
                                        {submitForm.data.files.map((file, i) => (
                                            <li key={`file-${i}`} className="flex items-center gap-2 rounded-md bg-white p-2 dark:bg-gray-800">
                                                <FileTypeIcon name={file.name} className="h-4 w-4 shrink-0 text-gray-400" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm text-gray-700 dark:text-gray-300">{file.name}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(file.size)}</p>
                                                </div>
                                                <RemoveButton onClick={() => removeFile(i)} />
                                            </li>
                                        ))}
                                        {submitForm.data.links.map((link, i) => (
                                            <li key={`link-${i}`} className="flex items-center gap-2 rounded-md bg-white p-2 dark:bg-gray-800">
                                                <LinkTypeIcon className="h-4 w-4 shrink-0 text-gray-400" />
                                                <p className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300" title={link.url}>
                                                    {link.title || link.url}
                                                </p>
                                                <RemoveButton onClick={() => removeLink(i)} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {task.deliverables?.length > 0 && (
                                <div className="mt-2.5 space-y-2.5">
                                    {deliverableFiles.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Already submitted &middot; Files</p>
                                            <ul className="space-y-1">
                                                {deliverableFiles.map((d) => (
                                                    <DeliverableItem key={d.id} d={d} canRemove={canEditDeliverables} onRemove={() => removeDeliverable(d.id)} />
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {deliverableLinks.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Already submitted &middot; Links</p>
                                            <ul className="space-y-1">
                                                {deliverableLinks.map((d) => (
                                                    <DeliverableItem key={d.id} d={d} canRemove={canEditDeliverables} onRemove={() => removeDeliverable(d.id)} />
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            {submitForm.progress && (
                                <div className="mt-2.5">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                            style={{ width: `${submitForm.progress.percentage}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Uploading... {submitForm.progress.percentage}%</p>
                                </div>
                            )}
                            <div className="mt-2.5 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={submitForm.processing}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
                                >
                                    {submitForm.progress ? `Uploading ${submitForm.progress.percentage}%` : task.status === 'submitted' ? 'Add More' : 'Submit Work'}
                                </button>
                                <button type="button" disabled={submitForm.processing} onClick={() => { setShowAddPanel(false); submitForm.reset(); }} className="text-sm text-gray-500 hover:underline disabled:opacity-50 dark:text-gray-400">Cancel</button>
                            </div>
                            <InputError message={submitForm.errors.files} className="mt-2" />
                        </form>
                    )}
                </div>
            )}

            {!showAddPanel && task.deliverables?.length > 0 && (
                <div className="mt-2">
                    {showDeliverables && (
                        <div className="mb-2 space-y-2.5 rounded-md bg-gray-50 p-2 dark:bg-gray-900/40">
                            {deliverableFiles.length > 0 && (
                                <div>
                                    {deliverableLinks.length > 0 && (
                                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Files</p>
                                    )}
                                    <ul className="space-y-1">
                                        {deliverableFiles.map((d) => (
                                            <DeliverableItem key={d.id} d={d} canRemove={canEditDeliverables} onRemove={() => removeDeliverable(d.id)} />
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {deliverableLinks.length > 0 && (
                                <div>
                                    {deliverableFiles.length > 0 && (
                                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Links</p>
                                    )}
                                    <ul className="space-y-1">
                                        {deliverableLinks.map((d) => (
                                            <DeliverableItem key={d.id} d={d} canRemove={canEditDeliverables} onRemove={() => removeDeliverable(d.id)} />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <FooterToggle
                            active={showDeliverables}
                            onClick={() => setShowDeliverables((v) => !v)}
                            label="Submitted"
                            count={task.deliverables.length}
                            icon={
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            }
                        />
                        {task.status !== 'done' && task.deliverables?.some((d) => d.type === 'file') && (
                            <a
                                href={route('tasks.download', task.id)}
                                title="Download ZIP"
                                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Download ZIP
                            </a>
                        )}
                        {task.updated_at && ['submitted', 'in_review', 'done'].includes(task.status) && (
                            <span className="flex items-center gap-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
                                Updated {formatDue(task.updated_at)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!isEditing && canReview && task.status === 'submitted' && (
                <div className="mt-2">
                    <SecondaryButton onClick={startReview}>Start Review</SecondaryButton>
                </div>
            )}

            {!isEditing && canReview && task.status === 'in_review' && (
                <div className="mt-3 space-y-2 rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                    <AutoGrowTextarea
                        value={reviewForm.data.feedback}
                        onChange={(e) => reviewForm.setData('feedback', e.target.value)}
                        placeholder="Feedback (required if rejecting)"
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                        <AutoGrowTextarea
                            value={reopenForm.data.feedback}
                            onChange={(e) => reopenForm.setData('feedback', e.target.value)}
                            placeholder="What needs to change?"
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        />
                        <InputError message={reopenForm.errors.feedback} className="mt-1" />
                        <div className="flex gap-2">
                            <PrimaryButton disabled={reopenForm.processing}>Send Back for Changes</PrimaryButton>
                            <button type="button" onClick={() => setShowReopenPanel(false)} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-3 border-t border-gray-100 pt-2.5 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-1">
                    <FooterToggle
                        active={showComments}
                        onClick={() => toggleSection('comments')}
                        label="Comments"
                        count={commentCount > 0 ? commentCount : null}
                        icon={
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        }
                    />
                    {dependencyCount > 0 && (
                        <FooterToggle
                            active={showDependencies}
                            onClick={() => toggleSection('dependencies')}
                            label={dependenciesBlocked ? 'Blocked by' : 'Depends on'}
                            count={dependencyCount}
                            variant={dependenciesBlocked ? 'warning' : 'default'}
                            icon={
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <circle cx="6" cy="6" r="2.25" />
                                    <circle cx="18" cy="18" r="2.25" />
                                    <path strokeLinecap="round" d="M8 7.5l8 9" />
                                </svg>
                            }
                        />
                    )}
                    <div className="ml-auto">
                        <FooterToggle
                            active={showChecklist}
                            onClick={() => toggleSection('checklist')}
                            label="Checklist"
                            count={task.checklist_items?.length > 0 ? `${task.checklist_items.filter((i) => i.done).length}/${task.checklist_items.length}` : null}
                            icon={
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 9l2 2 4-4" />
                                </svg>
                            }
                        />
                    </div>
                </div>

                {showDependencies && (
                    <div className="mt-2 space-y-1.5 rounded-md bg-gray-50 p-3 dark:bg-gray-900/40">
                        {task.dependencies.map((dep) => (
                            <button
                                key={dep.id}
                                type="button"
                                onClick={() => onJumpToTask?.(dep.id)}
                                title={`Go to "${dep.title}"`}
                                className="flex w-full min-w-0 items-center gap-2 rounded-md py-1 text-left text-sm transition hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                                <span className={`h-2 w-2 shrink-0 rounded-full ${dep.status === 'done' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                <span className="min-w-0 flex-1 truncate text-gray-700 hover:underline dark:text-gray-300">{dep.title}</span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusStyles[dep.status] ?? 'bg-gray-100 text-gray-600'}`}>{dep.status.replace('_', ' ')}</span>
                            </button>
                        ))}
                    </div>
                )}

                {showChecklist && (
                    <div className="mt-2 space-y-2 rounded-md bg-gray-50 p-3 dark:bg-gray-900/40">
                        {task.checklist_items?.length > 0 && (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all"
                                    style={{
                                        width: `${Math.round((task.checklist_items.filter((i) => i.done).length / task.checklist_items.length) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}
                        {task.checklist_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 group">
                                <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => toggleChecklistItem(item)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                                />
                                <span className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm ${item.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {item.title}
                                </span>
                                <button
                                    onClick={() => deleteChecklistItem(item)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                    title="Remove item"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        <form onSubmit={addChecklistItem} className="flex items-center gap-2 pt-1">
                            <AutoGrowTextarea
                                value={checklistForm.data.title}
                                onChange={(e) => checklistForm.setData('title', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (checklistForm.data.title.trim()) addChecklistItem(e);
                                    }
                                }}
                                placeholder="Add a checklist item…"
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <SecondaryButton type="submit" disabled={checklistForm.processing || !checklistForm.data.title.trim()}>Add</SecondaryButton>
                        </form>
                    </div>
                )}

                {showComments && (
                    <div className="mt-2 space-y-4 rounded-md bg-gray-50 p-3 dark:bg-gray-900/40">
                        {commentTree.roots.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                isReply={false}
                                childrenByParent={commentTree.childrenByParent}
                                byId={commentTree.byId}
                                collapsedIds={collapsedIds}
                                onToggleCollapse={toggleCommentCollapse}
                                replyingToId={replyingTo?.id ?? null}
                                composer={commentComposer}
                                highlightedCommentId={highlightedCommentId}
                                editingCommentId={editingCommentId}
                                editCommentForm={editCommentForm}
                                currentUserId={currentUserId}
                                canManage={canManage}
                                members={members}
                                onSaveEdit={saveCommentEdit}
                                onStartEdit={startEditComment}
                                onCancelEdit={() => setEditingCommentId(null)}
                                onDelete={deleteComment}
                                onStartReply={startReply}
                                onScrollToComment={scrollToComment}
                            />
                        ))}
                        {commentCount === 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No comments yet. Be the first to say something.</p>
                        )}
                        {/* The bottom box is for starting a brand-new top-level comment.
                            While replying to an existing comment, the same composer
                            renders inline inside that thread instead (see CommentThread). */}
                        {!replyingTo && commentComposer}
                    </div>
                )}
            </div>
        </div>

        <Modal
            show={showHistory}
            onClose={() => setShowHistory(false)}
            maxWidth="2xl"
            overlayClassName="bg-black/55 dark:bg-black/70"
        >
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">History — {task.title}</h3>
                    <button
                        onClick={() => setShowHistory(false)}
                        aria-label="Close"
                        className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4 max-h-96 overflow-y-auto">
                    {(!task.activity_logs || task.activity_logs.length === 0) ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500">No history yet for this task.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {task.activity_logs.map((log) => (
                                <LogEntryRow key={log.id} log={log} dense />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>

        {ConfirmDialog}
        </div>
    );
}