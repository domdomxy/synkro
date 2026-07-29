/**
 * Single source of truth for task status display, shared by the user and
 * admin dashboards (and anywhere else that renders a status breakdown).
 * Previously each dashboard kept its own copy of these maps, which meant a
 * new status or a color tweak had to be applied twice.
 */
export const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    in_review: 'In Review',
    done: 'Done',
};

// Tailwind background classes, used for the small legend dots and progress bars.
export const statusColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    submitted: 'bg-yellow-500',
    in_review: 'bg-purple-500',
    done: 'bg-green-500',
};

// Raw hex values, used for the SVG donut segments (can't take Tailwind classes).
export const statusStrokeColors = {
    todo: '#9ca3af',
    in_progress: '#3b82f6',
    submitted: '#eab308',
    in_review: '#a855f7',
    done: '#22c55e',
};
