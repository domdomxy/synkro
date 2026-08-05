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
    project_restored: { path: ICON_PATHS.undo, color: 'text-green-500' },
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
    task_restored: { path: ICON_PATHS.undo, color: 'text-green-500' },
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
    invitation_cancelled: { path: ICON_PATHS.minus, color: 'text-gray-400' },
    comment_added: { path: ICON_PATHS.chat, color: 'text-blue-500' },
    comment_edited: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    comment_deleted: { path: ICON_PATHS.trash, color: 'text-red-500' },
    resource_added: { path: ICON_PATHS.plus, color: 'text-green-500' },
    resource_updated: { path: ICON_PATHS.pencil, color: 'text-blue-500' },
    resource_removed: { path: ICON_PATHS.trash, color: 'text-red-500' },
};

export const fieldLabels = {
    title: 'Title',
    description: 'Description',
    due_date: 'Due Date',
    name: 'Project Name',
    priority: 'Priority',
};

/** Structured detail rows for a log entry's expandable panel (used by the Logs page and TaskRow's History). */
export function getLogDetails(log) {
    const d = log.details ?? {};

    if (['task_created', 'task_started', 'task_review_started', 'task_approved', 'task_rejected'].includes(log.action)) {
        // No details panel here - the task name is already in the description
        // above ("Administrator approved 'fff'"), so an expand arrow that just
        // repeats it back would be dead weight.
        return [];
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

    if (log.action === 'checklist_item_updated') {
        return [
            { label: 'Task', value: d.task_title },
            d.old_item_title !== undefined && d.new_item_title !== undefined && {
                label: 'Checklist Item',
                oldValue: d.old_item_title || '-',
                newValue: d.new_item_title || '-',
                isChange: true,
            },
        ].filter(Boolean);
    }

    if (log.action === 'checklist_item_deleted') {
        return [
            { label: 'Task', value: d.task_title },
            { label: 'Checklist Item', value: d.item_title },
        ].filter((r) => r.value);
    }

    if (log.action === 'dependency_added' || log.action === 'dependency_removed') {
        return [
            { label: 'Task', value: d.task_title },
            { label: 'Depends On', value: d.depends_on_title },
        ].filter((r) => r.value);
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
    const actor = `**${log.user?.name ?? 'Someone'}**`;
    const d = log.details ?? {};
    const target = d.target_name ? `**${d.target_name}**` : d.target_name;
    const role = d.role ? `**${d.role}**` : d.role;
    const oldRole = d.old_role ? `**${d.old_role}**` : d.old_role;
    const newRole = d.new_role ? `**${d.new_role}**` : d.new_role;
    switch (log.action) {
        case 'project_created': return `${actor} created the project`;
        case 'project_deleted': return `${actor} deleted the project`;
        case 'project_restored': return `${actor} restored the project from the trash`;
        case 'project_deletion_requested': return `${actor} requested project deletion`;
        case 'project_deletion_cancelled': return `${actor} cancelled the project deletion`;
        case 'project_updated': return `${actor} updated the project`;
        case 'member_added': return `${actor} added ${target} as ${role}`;
        case 'member_removed': return `${actor} removed ${target} (${role})`;
        case 'member_left': return `${target ?? actor} (${role}) left the project`;
        case 'role_changed': return `${actor} changed ${target}'s role from ${oldRole} to ${newRole}`;
        case 'ownership_transferred': return `${actor} transferred ownership to ${target}`;
        case 'task_created': return `${actor} created task "${d.task_title}"`;
        case 'task_deleted': return `${actor} deleted task "${d.task_title}"`;
        case 'task_restored': return `${actor} restored task "${d.task_title}" from the trash`;
        case 'task_assigned': return `${actor} assigned "${d.task_title}" to ${target}`;
        case 'task_reassigned': return `${actor} reassigned "${d.task_title}" from ${d.old_assignee ? `**${d.old_assignee}**` : 'unassigned'} to ${d.new_assignee ? `**${d.new_assignee}**` : 'unassigned'}`;
        case 'task_unassigned': return `${actor} unassigned "${d.task_title}" (was ${d.old_assignee ? `**${d.old_assignee}**` : d.old_assignee})`;
        case 'task_updated': return `${actor} updated "${d.task_title}"`;
        case 'task_started': return `${actor} started "${d.task_title}"`;
        case 'task_review_started': return `${actor} started reviewing "${d.task_title}"`;
        case 'task_approved': return `${actor} approved "${d.task_title}"`;
        case 'task_rejected': return `${actor} sent "${d.task_title}" back for changes`;
        case 'submission_reset': return `${actor} reset the submission for "${d.task_title}"`;
        case 'submission_kept': return `${actor} kept the submission for "${d.task_title}"`;
        case 'task_reopened': return `${actor} reopened "${d.task_title}" for changes`;
        case 'checklist_item_updated': return `${actor} edited a checklist item on "${d.task_title}" from "${d.old_item_title}" to "${d.new_item_title}"`;
        case 'checklist_item_deleted': return `${actor} removed the checklist item "${d.item_title}" from "${d.task_title}"`;
        case 'dependency_added': return `${actor} made "${d.task_title}" depend on "${d.depends_on_title}"`;
        case 'dependency_removed': return `${actor} removed the dependency of "${d.task_title}" on "${d.depends_on_title}"`;
        case 'invitation_denied': return `${target} declined the invitation to join`;
        case 'invitation_sent': return `${actor} invited ${target} as ${role}`;
        case 'invitation_cancelled': return `${actor} cancelled ${target}'s invitation to join as ${role}`;
        case 'invitation_accepted': return `${target ?? actor} accepted the invitation and joined as ${role}`;
        case 'comment_added': return `${actor} commented on "${d.task_title}"`;
        case 'comment_edited': return `${actor} edited a comment on "${d.task_title}"`;
        case 'comment_deleted': return `${actor} deleted a comment on "${d.task_title}"`;
        case 'resource_added': return `${actor} added the file "${d.name}"`;
        case 'resource_updated': return `${actor} updated the file "${d.old_name}"`;
        case 'resource_removed': return `${actor} removed the file "${d.name}"`;
        default: return `${actor} performed ${formatActionLabel(log.action)}`;
    }
}