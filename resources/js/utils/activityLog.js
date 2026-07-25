/** Fallback for any action not explicitly described below: "some_action" -> "Some Action". */
export function formatActionLabel(action) {
    return action
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export const ICON_PATHS = {
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
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
};

export const actionIconConfig = {
    project_created: { path: ICON_PATHS.build, color: 'text-green-500' },
    project_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    project_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
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
    submission_reset: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    submission_kept: { path: ICON_PATHS.check, color: 'text-green-500' },
    task_reopened: { path: ICON_PATHS.undo, color: 'text-amber-500' },
    invitation_sent: { path: ICON_PATHS.plus, color: 'text-blue-500' },
    invitation_accepted: { path: ICON_PATHS.check, color: 'text-green-500' },
    invitation_denied: { path: ICON_PATHS.close_or_x, color: 'text-red-500' },
    comment_added: { path: ICON_PATHS.chat, color: 'text-blue-500' },
    comment_edited: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    comment_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
};

export const fieldLabels = {
    title: 'Title',
    description: 'Description',
    due_date: 'Due Date',
    name: 'Project Name',
    priority: 'Priority',
    estimated_hours: 'Estimated Hours',
};

/** Structured detail rows for a log entry's expandable panel (used by the Logs page and TaskRow's History). */
export function getLogDetails(log) {
    const d = log.details ?? {};

    if (log.action === 'task_created') {
        return [
            d.task_title && { label: 'Task Name', value: d.task_title },
        ].filter(Boolean);
    }

    if ((log.action === 'task_updated' || log.action === 'project_updated') && d.changes) {
        return Object.entries(d.changes).map(([key, val]) => ({
            label: fieldLabels[key] ?? key,
            oldValue: val.old ?? '-',
            newValue: val.new ?? '-',
            isChange: true,
            isHtml: key === 'description',
        }));
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
            { label: 'From', value: d.old_assignee ?? 'Unassigned' },
            { label: 'To', value: d.new_assignee },
        ].filter((r) => r.value);
    }

    if (log.action === 'role_changed') {
        return [
            { label: 'User', value: d.target_name },
            { label: 'Previous Role', value: d.old_role },
            { label: 'New Role', value: d.new_role },
        ].filter((r) => r.value);
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

export function describeLog(log) {
    const actor = log.user?.name ?? 'Someone';
    const d = log.details ?? {};
    switch (log.action) {
        case 'project_created': return `${actor} created the project`;
        case 'project_deleted': return `${actor} deleted the project`;
        case 'project_updated': return `${actor} updated the project`;
        case 'member_added': return `${actor} added ${d.target_name} as ${d.role}`;
        case 'member_removed': return d.reason ? `${actor} removed ${d.target_name} (${d.role}) — "${d.reason}"` : `${actor} removed ${d.target_name} (${d.role})`;
        case 'member_left': return d.reason ? `${d.target_name ?? actor} (${d.role}) left the project — "${d.reason}"` : `${d.target_name ?? actor} (${d.role}) left the project`;
        case 'role_changed': return `${actor} changed ${d.target_name}'s role from ${d.old_role} to ${d.new_role}`;
        case 'ownership_transferred': return `${actor} transferred ownership to ${d.target_name}`;
        case 'task_created': return `${actor} created task "${d.task_title}"`;
        case 'task_deleted': return `${actor} deleted task "${d.task_title}"`;
        case 'task_assigned': return `${actor} assigned "${d.task_title}" to ${d.target_name}`;
        case 'task_reassigned': return `${actor} reassigned "${d.task_title}" from ${d.old_assignee ?? 'unassigned'} to ${d.new_assignee}`;
        case 'task_unassigned': return `${actor} unassigned "${d.task_title}" (was ${d.old_assignee})`;
        case 'task_updated': return `${actor} updated "${d.task_title}"`;
        case 'submission_reset': return `${actor} reset the submission for "${d.task_title}"`;
        case 'submission_kept': return `${actor} kept the submission for "${d.task_title}"`;
        case 'task_reopened': return `${actor} reopened "${d.task_title}" for changes`;
        case 'invitation_denied': return `${d.target_name} declined the invitation to join`;
        case 'invitation_sent': return `${actor} invited ${d.target_name} as ${d.role}`;
        case 'invitation_accepted': return `${d.target_name ?? actor} accepted the invitation and joined as ${d.role}`;
        case 'comment_added': return `${actor} commented: "${d.preview}"`;
        case 'comment_edited': return `${actor} edited a comment`;
        case 'comment_deleted': return `${actor} deleted a comment: "${d.preview}"`;
        default: return `${actor} performed ${formatActionLabel(log.action)}`;
    }
}
