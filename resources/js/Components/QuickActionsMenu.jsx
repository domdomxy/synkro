import Dropdown from '@/Components/Dropdown';
import { Link } from '@inertiajs/react';

function ActionLink({ href, icon, children, badge }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
            <span className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
            <span className="flex-1">{children}</span>
            {typeof badge === 'number' && badge > 0 && (
                <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-semibold text-white">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    );
}

/**
 * Collapses a row of quick-navigation buttons (Manage Users, View Projects,
 * etc.) into a single dropdown trigger. Reuses the same shared Dropdown that
 * powers the account/settings menu in AuthenticatedLayout - a trigger button
 * plus a floating panel of links - just with a plain "label + chevron"
 * trigger instead of an avatar, so it reads as a menu rather than a profile
 * switcher.
 */
export default function QuickActionsMenu({ items, label = 'Quick Actions' }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    {label}
                    <svg className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </Dropdown.Trigger>

            <Dropdown.Content align="left" width="72" contentClasses="py-2 bg-white dark:bg-gray-800">
                {items.map((item) => (
                    <ActionLink key={item.href} href={item.href} icon={item.icon} badge={item.badge}>
                        {item.label}
                    </ActionLink>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}
