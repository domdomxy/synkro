import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import Linkify from '@/Components/Linkify';
import RichTextContent from '@/Components/RichTextContent';
import DateRangeFilter from '@/Components/DateRangeFilter';
import Avatar from '@/Components/Avatar';
import { cleanParams } from '@/utils/queryParams';
import { Head, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

const actionLabels = {
    // Project activity
    project_created: 'Project Created',
    project_updated: 'Project Updated',
    project_deleted: 'Project Deleted',
    member_added: 'Member Added',
    member_removed: 'Member Removed',
    member_left: 'Member Left',
    role_changed: 'Role Changed',
    ownership_transferred: 'Ownership Transferred',
    task_created: 'Task Created',
    task_updated: 'Task Updated',
    task_assigned: 'Task Assigned',
    task_reassigned: 'Task Reassigned',
    task_unassigned: 'Task Unassigned',
    task_deleted: 'Task Deleted',
    task_started: 'Task Started',
    task_review_started: 'Review Started',
    task_approved: 'Task Approved',
    task_rejected: 'Task Rejected',
    submission_reset: 'Submission Reset',
    submission_kept: 'Submission Kept',
    task_reopened: 'Task Reopened',
    checklist_item_updated: 'Checklist Item Edited',
    checklist_item_deleted: 'Checklist Item Removed',
    dependency_added: 'Dependency Added',
    dependency_removed: 'Dependency Removed',
    invitation_sent: 'Invitation Sent',
    invitation_accepted: 'Invitation Accepted',
    invitation_denied: 'Invitation Denied',
    comment_added: 'Comment Added',
    comment_edited: 'Comment Edited',
    comment_deleted: 'Comment Deleted',
    resource_added: 'Resource Added',
    resource_updated: 'Resource Updated',
    resource_removed: 'Resource Removed',
    // Account activity (logged_in/logged_out live in the separate Login History view instead)
    account_created: 'Account Created',
    password_changed: 'Password Changed',
    password_reset: 'Password Reset',
    profile_updated: 'Profile Updated',
    avatar_updated: 'Avatar Updated',
    avatar_removed: 'Avatar Removed',
    account_deactivated: 'Account Deactivated',
    account_deletion_requested: 'Account Deletion Requested',
    account_deletion_cancelled: 'Account Deletion Cancelled',
    account_deleted: 'Account Deleted',
    account_restored: 'Account Restored',
};

/** Fallback for any action not explicitly mapped above: "some_action" -> "Some Action". */
function formatActionLabel(action) {
    return action
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const fieldLabels = {
    title: 'Title',
    description: 'Description',
    due_date: 'Due Date',
    name: 'Project Name',
};

const profileFieldLabels = {
    name: 'Name',
    email: 'Email Address',
};

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const ICON_PATHS = {
    build: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m9-13h.01M12 12h.01M12 16h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01',
    pencil: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    plus: 'M12 4v16m8-8H4',
    minus: 'M20 12H4',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    swap: 'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4',
    crown: 'M5 8l3 3 4-6 4 6 3-3-2 11H7L5 8z',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    person: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    undo: 'M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4',
    check: 'M5 13l4 4L19 7',
    dot: 'M12 12h.01',
    close_or_x: 'M6 18L18 6M6 6l12 12',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM8 11V7a4 4 0 118 0v4',
    bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

const actionIconConfig = {
    project_created: { path: ICON_PATHS.build, color: 'text-green-500' },
    project_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    project_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    project_deletion_requested: { path: ICON_PATHS.trash, color: 'text-amber-500' },
    project_deletion_cancelled: { path: ICON_PATHS.undo, color: 'text-green-500' },
    member_added: { path: ICON_PATHS.plus, color: 'text-green-500' },
    member_removed: { path: ICON_PATHS.minus, color: 'text-red-500' },
    member_left: { path: ICON_PATHS.logout, color: 'text-amber-500' },
    role_changed: { path: ICON_PATHS.swap, color: 'text-purple-500' },
    ownership_transferred: { path: ICON_PATHS.crown, color: 'text-purple-500' },
    task_created: { path: ICON_PATHS.clipboard, color: 'text-green-500' },
    task_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    task_assigned: { path: ICON_PATHS.person, color: 'text-blue-500' },
    task_reassigned: { path: ICON_PATHS.swap, color: 'text-blue-500' },
    task_unassigned: { path: ICON_PATHS.person, color: 'text-amber-500' },
    task_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    task_started: { path: ICON_PATHS.clipboard, color: 'text-blue-500' },
    task_review_started: { path: ICON_PATHS.clipboard, color: 'text-purple-500' },
    task_approved: { path: ICON_PATHS.check, color: 'text-green-500' },
    task_rejected: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    submission_reset: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    submission_kept: { path: ICON_PATHS.check, color: 'text-green-500' },
    task_reopened: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    checklist_item_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    checklist_item_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    dependency_added: { path: ICON_PATHS.plus, color: 'text-amber-500' },
    dependency_removed: { path: ICON_PATHS.minus, color: 'text-gray-400' },
    invitation_sent: { path: ICON_PATHS.plus, color: 'text-blue-500' },
    invitation_accepted: { path: ICON_PATHS.check, color: 'text-green-500' },
    invitation_denied: { path: ICON_PATHS.close_or_x, color: 'text-red-500' },
    comment_added: { path: ICON_PATHS.chat, color: 'text-green-500' },
    comment_edited: { path: ICON_PATHS.chat, color: 'text-blue-500' },
    comment_deleted: { path: ICON_PATHS.chat, color: 'text-red-500' },
    resource_added: { path: ICON_PATHS.plus, color: 'text-green-500' },
    resource_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    resource_removed: { path: ICON_PATHS.trash, color: 'text-red-500' },
    account_created: { path: ICON_PATHS.build, color: 'text-green-500' },
    password_changed: { path: ICON_PATHS.lock, color: 'text-amber-500' },
    password_reset: { path: ICON_PATHS.lock, color: 'text-amber-500' },
    profile_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    avatar_updated: { path: ICON_PATHS.person, color: 'text-blue-500' },
    avatar_removed: { path: ICON_PATHS.person, color: 'text-amber-500' },
    account_deactivated: { path: ICON_PATHS.minus, color: 'text-red-500' },
    account_deletion_requested: { path: ICON_PATHS.trash, color: 'text-amber-500' },
    account_deletion_cancelled: { path: ICON_PATHS.undo, color: 'text-green-500' },
    account_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    account_restored: { path: ICON_PATHS.undo, color: 'text-green-500' },
};

/**
 * Self-service view always addresses the actor as "You" ("You changed your password"). When an
 * admin is looking at someone else's logs, actorName is that person's first name instead, and
 * every "your" becomes "the" so it reads as "Jane changed the password" rather than assuming a
 * pronoun that isn't ours to guess.
 */
function describeLog(log, actorName = null) {
    const actor = actorName ?? 'You';
    const possessive = actorName ? 'the' : 'your';
    const d = log.details ?? {};
    switch (log.action) {
        case 'project_created': return `${actor} created the project`;
        case 'project_deleted': return `${actor} deleted the project`;
        case 'project_deletion_requested': return `${actor} requested project deletion`;
        case 'project_deletion_cancelled': return `${actor} cancelled the project deletion`;
        case 'project_updated': return `${actor} updated the project`;
        case 'member_added': return `${actor} added ${d.target_name} as ${d.role}`;
        case 'member_removed': return `${actor} removed ${d.target_name} (${d.role})`;
        case 'member_left': return `${actor} left the project`;
        case 'role_changed': return `${actor} changed ${d.target_name}'s role from ${d.old_role} to ${d.new_role}`;
        case 'ownership_transferred': return `${actor} transferred ownership to ${d.target_name}`;
        case 'task_created': return `${actor} created task "${d.task_title}"`;
        case 'task_deleted': return `${actor} deleted task "${d.task_title}"`;
        case 'task_assigned': return `${actor} assigned "${d.task_title}" to ${d.target_name}`;
        case 'task_reassigned': return `${actor} reassigned "${d.task_title}" from ${d.old_assignee ?? 'unassigned'} to ${d.new_assignee ?? 'unassigned'}`;
        case 'task_unassigned': return `${actor} unassigned "${d.task_title}" (was ${d.old_assignee})`;
        case 'task_updated': return `${actor} updated "${d.task_title}"`;
        case 'task_started': return `${actor} started "${d.task_title}"`;
        case 'task_review_started': return `${actor} started reviewing "${d.task_title}"`;
        case 'task_approved': return `${actor} approved "${d.task_title}"`;
        case 'task_rejected': return `${actor} sent "${d.task_title}" back for changes`;
        case 'submission_reset': return `${actor} reset the submission for "${d.task_title}"`;
        case 'submission_kept': return `${actor} kept the submission for "${d.task_title}"`;
        case 'task_reopened': return `${actor} reopened "${d.task_title}" for changes`;
        case 'checklist_item_updated': return `${actor} renamed a checklist item on "${d.task_title}" from "${d.old_item_title}" to "${d.new_item_title}"`;
        case 'checklist_item_deleted': return `${actor} removed the checklist item "${d.item_title}" from "${d.task_title}"`;
        case 'dependency_added': return `${actor} made "${d.task_title}" depend on "${d.depends_on_title}"`;
        case 'dependency_removed': return `${actor} removed the dependency of "${d.task_title}" on "${d.depends_on_title}"`;
        case 'invitation_denied': return `${actor} declined the invitation to join`;
        case 'invitation_sent': return `${actor} invited ${d.target_name} as ${d.role}`;
        case 'invitation_accepted': return `${actor} accepted the invitation and joined as ${d.role}`;
        case 'comment_added': return `${actor} commented on "${d.task_title}"`;
        case 'comment_edited': return `${actor} edited a comment on "${d.task_title}"`;
        case 'comment_deleted': return `${actor} deleted a comment on "${d.task_title}"`;
        case 'resource_added': return `${actor} added the file "${d.name}"`;
        case 'resource_updated': return `${actor} updated the file "${d.old_name}"`;
        case 'resource_removed': return `${actor} removed the file "${d.name}"`;
        case 'account_created': return `${actor} created ${possessive} account`;
        case 'password_changed': return `${actor} changed ${possessive} password`;
        case 'password_reset': return `${actor} reset ${possessive} password`;
        case 'profile_updated': return `${actor} updated ${possessive} profile`;
        case 'avatar_updated': return `${actor} updated ${possessive} account photo`;
        case 'avatar_removed': return `${actor} removed ${possessive} account photo`;
        case 'account_deactivated': return `${actor} deactivated ${possessive} account`;
        case 'account_deletion_requested': return actorName
            ? `${actor} requested account deletion`
            : `${actor} requested account deletion — check your email to confirm`;
        case 'account_deletion_cancelled': return `${actor} cancelled the pending account deletion`;
        case 'account_deleted': return `${actor} deleted ${possessive} account`;
        case 'account_restored': return `${actor} restored ${possessive} account`;
        default: return `${actor} performed ${formatActionLabel(log.action)}`;
    }
}

function getDetails(log) {
    const d = log.details ?? {};

    if (['task_created', 'task_started', 'task_review_started', 'task_approved', 'task_rejected'].includes(log.action)) {
        return [
            d.task_title && { label: 'Task Name', value: d.task_title },
        ].filter(Boolean);
    }

    if (log.action === 'task_updated' && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: fieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
            isHtml: key === 'description',
        }));
    }

    if (log.action === 'project_updated' && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: fieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
            isHtml: key === 'description',
        }));
    }

    if (log.action === 'profile_updated' && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: profileFieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
        }));
    }

    if (log.action === 'comment_added' || log.action === 'comment_deleted') {
        return [
            { label: 'Task', value: d.task_title },
            { label: 'Comment', value: d.preview },
        ].filter((r) => r.value);
    }

    if (log.action === 'comment_edited') {
        return [
            { label: 'Task', value: d.task_title },
            d.old_preview !== undefined && d.new_preview !== undefined && {
                label: 'Comment',
                oldValue: d.old_preview || '-',
                newValue: d.new_preview || '-',
                isChange: true,
            },
        ].filter(Boolean);
    }

    if (log.action === 'dependency_added' || log.action === 'dependency_removed') {
        return [
            { label: 'Task', value: d.task_title },
            { label: 'Depends On', value: d.depends_on_title },
        ].filter((r) => r.value);
    }

    if (log.action === 'resource_added' || log.action === 'resource_removed') {
        return [
            { label: 'File', value: d.name },
        ].filter((r) => r.value);
    }

    if (log.action === 'resource_updated') {
        return [
            d.old_name !== undefined && d.name !== undefined && {
                label: 'File',
                oldValue: d.old_name || '-',
                newValue: d.name || '-',
                isChange: true,
            },
        ].filter(Boolean);
    }

    if (log.action === 'task_assigned') {
        return [
            { label: 'Assigned To', value: d.target_name },
            { label: 'Task', value: d.task_title },
        ].filter((r) => r.value);
    }

    if (log.action === 'task_reassigned') {
        return [
            { label: 'Task', value: d.task_title },
            {
                label: 'Assignee',
                oldValue: d.old_assignee ?? 'Unassigned',
                newValue: d.new_assignee,
                isChange: true,
            },
        ].filter((r) => r.value || r.isChange);
    }

    if (log.action === 'role_changed') {
        return [
            { label: 'User', value: d.target_name },
            {
                label: 'Role',
                oldValue: d.old_role,
                newValue: d.new_role,
                isChange: true,
            },
        ].filter((r) => r.value || r.isChange);
    }

    if (log.action === 'member_added') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
        ].filter((r) => r.value);
    }

    if (log.action === 'member_removed' || log.action === 'member_left') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Role', value: d.role },
            { label: 'Reason', value: d.reason },
        ].filter((r) => r.value);
    }

    return [];
}

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return null;
}

function LogRow({ log, actorName, actor }) {
    const [open, setOpen] = useState(false);
    const details = getDetails(log);
    const hasDetails = details.length > 0;
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.dot, color: 'text-gray-400' };
    const relative = timeAgo(log.created_at);

    return (
        <li className="border-b dark:border-gray-700 last:border-0">
            <button
                onClick={() => hasDetails && setOpen((v) => !v)}
                className={`flex w-full items-start gap-3 px-6 py-3 text-left transition ${hasDetails ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
            >
                <span className="relative mt-0.5 h-8 w-8 shrink-0">
                    <Avatar user={actor} size="h-8 w-8" rounded="rounded-full" />
                    <span
                        className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800 ${iconConfig.color}`}
                    >
                        <Icon path={iconConfig.path} className="h-3 w-3" />
                    </span>
                </span>
                <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{describeLog(log, actorName)}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {relative && <span className="text-gray-300 dark:text-gray-600">· {relative}</span>}
                        {log.project ? (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {log.project.name}
                            </span>
                        ) : (
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                                Account
                            </span>
                        )}
                    </p>
                </div>
                {hasDetails && (
                    <svg
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {open && hasDetails && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                    <dl className="space-y-2">
                        {details.map((item, i) => (
                            <div key={i}>
                                {item.isChange ? (
                                    item.isHtml ? (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1.5 space-y-2">
                                                <div className="rounded-md border border-red-100 bg-red-50/50 p-2.5 dark:border-red-900 dark:bg-red-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-red-400 dark:text-red-500">Previous</p>
                                                    <RichTextContent
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        html={item.oldValue && item.oldValue !== '-' ? item.oldValue : null}
                                                        fallback='<span class="italic text-gray-400">Empty</span>'
                                                    />
                                                </div>
                                                <div className="rounded-md border border-green-100 bg-green-50/50 p-2.5 dark:border-green-900 dark:bg-green-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-green-500 dark:text-green-400">Updated</p>
                                                    <RichTextContent
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        html={item.newValue && item.newValue !== '-' ? item.newValue : null}
                                                        fallback='<span class="italic text-gray-400">Empty</span>'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <span className="rounded bg-red-100 px-2 py-0.5 text-red-700 line-through dark:bg-red-900/40 dark:text-red-400">
                                                    {item.oldValue || '-'}
                                                </span>
                                                <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="rounded bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                                    {item.newValue || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                ) : item.label === 'Reason' ? (
                                    <div>
                                        <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6.5 6C4 6 2 8 2 10.5c0 2.2 1.6 4 3.7 4.4-.3 1-1 1.9-2.2 2.6-.3.2-.2.7.2.7 2.9-.2 5.3-2.4 5.3-6.2C9 8 7.8 6 6.5 6zm11 0c-2.5 0-4.5 2-4.5 4.5 0 2.2 1.6 4 3.7 4.4-.3 1-1 1.9-2.2 2.6-.3.2-.2.7.2.7 2.9-.2 5.3-2.4 5.3-6.2 0-3-1.2-6-2.5-6z" />
                                            </svg>
                                            {item.label}
                                        </dt>
                                        <dd className="mt-1.5 whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                                            <Linkify text={item.value} />
                                        </dd>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                        <dd className="break-words text-sm text-gray-700 dark:text-gray-300">
                                            {item.value}
                                        </dd>
                                    </div>
                                )}
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </li>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { action: 'all', project: 'all', per_page: DEFAULT_PER_PAGE };

export default function ActivityLogs({ logs, userProjects, filters, backHref, backLabel, viewingUser }) {
    const { auth } = usePage().props;
    const [action, setAction] = useState(filters?.action ?? 'all');
    const [project, setProject] = useState(filters?.project ?? 'all');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const paginationRef = useRef(null);

    // Same page component serves two routes: a user's own Activity Logs, and (when viewingUser
    // is present) an admin's read-only look at someone else's. Everything below just needs to
    // GET back to whichever route rendered it, so this picks the matching route + params once
    // rather than threading an admin/self branch through every handler.
    const indexRoute = viewingUser ? route('admin.users.logs', viewingUser.id) : route('activity.index');
    const loginHistoryRoute = viewingUser ? route('admin.users.login-history', viewingUser.id) : route('activity.login-history');
    const actorName = viewingUser ? viewingUser.name.split(' ')[0] : null;
    const actorUser = viewingUser ?? auth.user;

    const applyFilters = (overrides = {}) => {
        const next = { action, project, from, to, per_page: perPage, ...overrides };
        router.get(indexRoute, cleanParams(next, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleActionChange = (v) => { setAction(v); applyFilters({ action: v }); };
    const handleProjectChange = (v) => { setProject(v); applyFilters({ project: v }); };
    const handlePerPageChange = (v) => { setPerPage(v); applyFilters({ per_page: v }); };
    const handleDateRangeApply = (newFrom, newTo) => { setFrom(newFrom); setTo(newTo); applyFilters({ from: newFrom, to: newTo }); };

    const clearFilters = () => {
        setAction('all');
        setProject('all');
        setFrom('');
        setTo('');
        setPerPage(DEFAULT_PER_PAGE);
        router.get(indexRoute, {}, { preserveScroll: true });
    };

    const hasActiveFilters = action !== 'all' || project !== 'all' || from !== '' || to !== '';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton href={backHref ?? route('dashboard')} label={backLabel ?? 'Back to Dashboard'} />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {viewingUser ? `${viewingUser.name}'s Activity Logs` : 'Activity Logs'}
                    </h2>
                </div>
                <a
                    href={loginHistoryRoute}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Login History
                </a>
            </div>
        }>
            <Head title={viewingUser ? `${viewingUser.name}'s Activity Logs` : 'Activity Logs'} />
            <div className="py-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {viewingUser && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300">
                            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>
                                You're viewing {viewingUser.name}'s activity for support and moderation purposes. This is read-only and is recorded in the admin audit log.
                            </p>
                        </div>
                    )}
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <FiltersMenu
                            activeCount={[project !== 'all', action !== 'all', Boolean(from || to)].filter(Boolean).length}
                            onClear={clearFilters}
                        >
                            <FiltersMenu.Row label="Project">
                                <FilterSelect
                                    value={project}
                                    onChange={handleProjectChange}
                                    className="w-full"
                                    options={[{ value: 'all', label: 'All Projects' }, ...userProjects.map((p) => ({ value: String(p.id), label: p.name }))]}
                                />
                            </FiltersMenu.Row>
                            <FiltersMenu.Row label="Action">
                                <FilterSelect
                                    value={action}
                                    onChange={handleActionChange}
                                    className="w-full"
                                    options={[
                                        { value: 'all', label: 'All Actions' },
                                        ...Object.entries(actionLabels).map(([key, label]) => ({ value: key, label })),
                                    ]}
                                />
                            </FiltersMenu.Row>
                            <DateRangeFilter from={from} to={to} onApply={handleDateRangeApply} />
                        </FiltersMenu>
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {logs.total} event{logs.total !== 1 ? 's' : ''}{hasActiveFilters ? ' match your filters' : ' recorded'}
                    </p>

                    <div ref={paginationRef} className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={logs} />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                        {logs.data.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {hasActiveFilters ? 'No activity matches your filters.' : 'No activity recorded yet.'}
                                </p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul>
                                {logs.data.map((log) => (
                                    <LogRow key={`${log.source}-${log.id}`} log={log} actorName={actorName} actor={actorUser} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}
