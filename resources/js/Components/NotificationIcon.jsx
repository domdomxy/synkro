import Avatar from '@/Components/Avatar';

/**
 * A notification's leading icon: if the notification has a causer (the user who
 * triggered it), show their avatar with the notification-type icon badged onto
 * its bottom-right corner - same visual pattern as LogEntryRow's actor avatar
 * in the task History panel. System-generated notifications (reminders, overdue
 * alerts, auto-closed tickets/appeals) have no causer, so those fall back to the
 * plain colored type-icon circle used before.
 */
export default function NotificationIcon({ causer, style, size = 'h-8 w-8' }) {
    if (!causer) {
        return (
            <span className={`mt-0.5 flex ${size} shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {style.icon}
                </svg>
            </span>
        );
    }

    return (
        <span className={`relative mt-0.5 shrink-0 ${size}`}>
            <Avatar user={causer} size={size} rounded="rounded-full" />
            <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800 ${style.text}`}>
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    {style.icon}
                </svg>
            </span>
        </span>
    );
}
