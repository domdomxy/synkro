/**
 * Card heading with a small colored icon badge, matching the treatment the
 * Due Soon / Reminders panels already used on the user dashboard. Used here
 * to bring the rest of the dashboard cards (Activity, Tasks by Status,
 * Deadline Calendar, Recent Users/Projects, etc.) up to the same look
 * instead of the plain bold-text headings they had before.
 */
export default function SectionHeader({ icon, iconColor = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', title, badge, children }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                {badge !== undefined && badge !== null && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}
