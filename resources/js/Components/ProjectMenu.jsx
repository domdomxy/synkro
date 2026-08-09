import { Link } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

// Shared with the "Leave Project" item below so the browser's default focus
// ring doesn't poke a square corner out past the panel's rounded corners on
// the first/last item - swap it for a background highlight instead, same
// trick Dropdown.Link already uses.
const ITEM_CLASSES = 'flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm text-gray-700 transition hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:bg-gray-700';
const DANGER_ITEM_CLASSES = 'flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm text-red-600 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:text-red-400 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30';

function InfoIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function DeliverablesIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function ResourcesIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v13" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function LeaveIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

function DotsIcon() {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6h.01M12 12h.01M12 18h.01" />
        </svg>
    );
}

/**
 * The "..." project menu (Project Information / Deliverables / Resources /
 * Owner-Manager Settings). Used on every project page it can navigate to, so
 * `page` tells it which one it's currently rendered on, so that page's own
 * entry can be left out of its own list - navigating to where you already are
 * doesn't need a link. "Project Information" isn't a page (it opens a modal
 * in place via `onShowInfo`), so it's never excluded.
 */
export default function ProjectMenu({ project, page, isOwner, canManage, onShowInfo, canLeave = false, onLeave, className = '' }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    title="More options"
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 ${className}`}
                >
                    <DotsIcon />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="right" width="56" contentClasses="py-1 bg-white dark:bg-gray-800">
                <button type="button" onClick={onShowInfo} className={ITEM_CLASSES}>
                    <InfoIcon />
                    Project Information
                </button>
                {page !== 'deliverables' && (
                    <Link href={route('projects.deliverables', project.id)} className={ITEM_CLASSES}>
                        <DeliverablesIcon />
                        Deliverables
                    </Link>
                )}
                {page !== 'resources' && (
                    <Link href={route('projects.resources', project.id)} className={ITEM_CLASSES}>
                        <ResourcesIcon />
                        Resources
                    </Link>
                )}
                {canManage && page !== 'settings' && (
                    <>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                        <Link href={route('projects.settings', project.id)} className={ITEM_CLASSES}>
                            <SettingsIcon />
                            {isOwner ? 'Owner Settings' : 'Manager Settings'}
                        </Link>
                    </>
                )}
                {canLeave && (
                    <>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                        <button type="button" onClick={onLeave} className={DANGER_ITEM_CLASSES}>
                            <LeaveIcon />
                            Leave Project
                        </button>
                    </>
                )}
            </Dropdown.Content>
        </Dropdown>
    );
}
