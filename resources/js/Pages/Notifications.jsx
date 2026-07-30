import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import FilterSelect from '@/Components/FilterSelect';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import { NoteList } from '@/utils/noteFormat';
import { typeStyles, relativeTime, splitMessage } from '@/utils/notificationDisplay';
import { cleanParams } from '@/utils/queryParams';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useConfirm from '@/hooks/useConfirm';

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { filter: 'all', category: 'all', per_page: DEFAULT_PER_PAGE };

export default function Notifications({ notificationsList, filters }) {
    const { auth } = usePage().props;
    const [filter, setFilter] = useState(filters?.filter ?? 'all');
    const [category, setCategory] = useState(filters?.category ?? 'all');
    const [perPage, setPerPage] = useState(Number(filters?.per_page) || DEFAULT_PER_PAGE);
    const { confirm, ConfirmDialog } = useConfirm();

    const applyFilters = (overrides = {}) => {
        const next = { filter, category, per_page: perPage, ...overrides };
        router.get(route('notifications.index'), cleanParams(next, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleFilterChange = (v) => { setFilter(v); applyFilters({ filter: v }); };
    const handleCategoryChange = (v) => { setCategory(v); applyFilters({ category: v }); };
    const handlePerPageChange = (v) => { setPerPage(v); applyFilters({ per_page: v }); };

    const clearFilters = () => {
        setFilter('all');
        setCategory('all');
        setPerPage(DEFAULT_PER_PAGE);
        router.get(route('notifications.index'));
    };

    const hasActiveFilters = filter !== 'all' || category !== 'all';

    const openNotification = (note) => {
        if (!note.read_at) {
            router.patch(route('notifications.read', note.id), {}, { preserveScroll: true, preserveState: true });
        }
        if (note.url) router.visit(note.url);
    };

    const deleteNotification = (id) => {
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(route('notifications.read-all'), {}, { preserveScroll: true });
    };

    const clearAll = async () => {
        if (!(await confirm('This cannot be undone.', { title: 'Clear All Notifications?', danger: true, confirmLabel: 'Clear All' }))) return;
        router.delete(route('notifications.clear'), { preserveScroll: true });
    };

    const unreadOnPage = notificationsList.data.some((n) => !n.read_at);

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton href={route('dashboard')} label="Back to Dashboard" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
                </div>
                <div className="flex gap-3">
                    {unreadOnPage && (
                        <button onClick={markAllRead} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                            Mark all read
                        </button>
                    )}
                    {notificationsList.total > 0 && (
                        <button onClick={clearAll} className="text-sm font-medium text-gray-500 hover:underline dark:text-gray-400">
                            Clear all
                        </button>
                    )}
                </div>
            </div>
        }>
            <Head title="Notifications" />
            {ConfirmDialog}
            <div className="py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <FilterSelect
                            value={filter}
                            onChange={handleFilterChange}
                            className="w-36"
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'unread', label: 'Unread' },
                            ]}
                        />
                        <FilterSelect
                            value={category}
                            onChange={handleCategoryChange}
                            className="w-48"
                            options={[
                                { value: 'all', label: 'All Categories' },
                                { value: 'assignments', label: 'Assignments' },
                                { value: 'mentions', label: 'Mentions' },
                                { value: 'reviews', label: 'Reviews' },
                                { value: 'membership', label: 'Membership' },
                                { value: 'replies', label: 'Replies' },
                                { value: 'reminders', label: 'Reminders' },
                                ...(auth.user.role === 'admin' ? [{ value: 'administration', label: 'Administration' }] : []),
                            ]}
                        />
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {notificationsList.total} notification{notificationsList.total !== 1 ? 's' : ''}{hasActiveFilters ? ' match your filters' : ''}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={notificationsList} />
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {notificationsList.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                                <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {hasActiveFilters ? 'No notifications match your filters.' : 'No notifications yet.'}
                                </p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ul>
                                {notificationsList.data.map((note) => {
                                    const style = typeStyles[note.type] ?? typeStyles.task_assigned;
                                    const { title, description } = splitMessage(note.message);
                                    return (
                                        <li
                                            key={note.id}
                                            className={`group flex items-start gap-2 border-b border-gray-50 px-4 py-4 transition last:border-b-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/30 ${
                                                !note.read_at ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                                            }`}
                                        >
                                            <button onClick={() => openNotification(note)} className="flex flex-1 items-start gap-3 text-left">
                                                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text}`}>
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        {style.icon}
                                                    </svg>
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block text-sm ${!note.read_at ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                        {title}
                                                    </span>
                                                    {description && (
                                                        <NoteList
                                                            note={description}
                                                            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                                        />
                                                    )}
                                                    <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                                                        {relativeTime(note.created_at)}
                                                    </span>
                                                </span>
                                                {!note.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                                            </button>
                                            <button
                                                onClick={() => deleteNotification(note.id)}
                                                title="Delete notification"
                                                className="mt-1 shrink-0 rounded p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-gray-700"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
