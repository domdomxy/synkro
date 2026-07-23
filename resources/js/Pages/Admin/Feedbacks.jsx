import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import BackButton from '@/Components/BackButton';
import Linkify from '@/Components/Linkify';
import FilterSelect from '@/Components/FilterSelect';
import CategoryIcon, { resolveCategory } from '@/Components/CategoryIcon';
import ManageCategoriesModal from '@/Components/ManageCategoriesModal';

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400',
};

function CategoryBadge({ category, categories }) {
    const resolved = resolveCategory(category, categories);
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <CategoryIcon icon={resolved.icon} className="h-3.5 w-3.5" />
            {resolved.label}
        </span>
    );
}

function FeedbackItem({ feedback, isHighlighted, categories }) {
    const [open, setOpen] = useState(false);
    const updateForm = useForm({ status: feedback.status, message: '' });
    const isClosed = ['closed', 'rejected'].includes(feedback.status);
    const userReplyCount = feedback.responses?.filter((r) => r.sender_type === 'user').length ?? 0;

    // A deep-linked ticket (from a notification/email) should open expanded, not just scroll into view collapsed.
    useEffect(() => {
        if (isHighlighted) setOpen(true);
    }, [isHighlighted]);

    const submitUpdate = (e) => {
        e.preventDefault();
        updateForm.patch(route('admin.feedbacks.update', feedback.id), {
            preserveScroll: true,
            onSuccess: () => updateForm.setData('message', ''),
        });
    };

    return (
        <div
            id={`ticket-${feedback.id}`}
            className={`rounded-lg border bg-white shadow-sm transition dark:bg-gray-800 ${
                isHighlighted ? 'border-indigo-400 ring-2 ring-indigo-400 dark:border-indigo-500 dark:ring-indigo-500' : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{feedback.subject}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[feedback.status]}`}>
                            {feedback.status}
                        </span>
                        <CategoryBadge category={feedback.category} categories={categories} />
                        {userReplyCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {userReplyCount} user repl{userReplyCount > 1 ? 'ies' : 'y'}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span>{feedback.name} ({feedback.email})</span>
                        <span>ID: {feedback.tracking_id}</span>
                        <span>{new Date(feedback.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {feedback.responses?.length > 0 && <span>{feedback.responses.length} message{feedback.responses.length > 1 ? 's' : ''}</span>}
                    </div>
                </div>
                <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform mt-1 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="border-t border-gray-100 p-4 space-y-4 dark:border-gray-700">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {['pending', 'reviewing', 'accepted', 'rejected', 'closed'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateForm.setData('status', s)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                                        updateForm.data.status === s
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {updateForm.data.status !== feedback.status && (
                            <p className="mt-2 text-xs text-indigo-500 dark:text-indigo-400">
                                Staged: {feedback.status} → {updateForm.data.status}. Add a message below and send to apply it.
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Conversation</p>
                        <div className="space-y-2">
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"><Linkify text={feedback.message} /></p>

                                {(feedback.attachment_path || feedback.attachments?.length > 0) && (
                                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {feedback.attachment_path && (
                                            <a href={`/storage/${feedback.attachment_path}`} target="_blank" rel="noreferrer">
                                                <img src={`/storage/${feedback.attachment_path}`} alt="attachment" className="h-24 w-full rounded-md object-cover shadow" />
                                            </a>
                                        )}
                                        {feedback.attachments?.map((att) => (
                                            <a key={att.id} href={`/storage/${att.path}`} target="_blank" rel="noreferrer" title={att.original_name}>
                                                <img src={`/storage/${att.path}`} alt={att.original_name} className="h-24 w-full rounded-md object-cover shadow" />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    {feedback.name}
                                    <span className="ml-1 italic">(original message)</span>
                                    {' · '}
                                    {new Date(feedback.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>

                            {feedback.responses?.map((r) => (
                                <div
                                    key={r.id}
                                    className={`rounded-md p-3 ${
                                        r.sender_type === 'admin'
                                            ? 'bg-indigo-50 dark:bg-indigo-950/30'
                                            : 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                                    }`}
                                >
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"><Linkify text={r.message} /></p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        {r.sender_type === 'admin' ? (r.admin?.name ?? 'Admin') : feedback.name}
                                        {r.sender_type === 'user' && <span className="ml-1 italic">(user)</span>}
                                        {' · '}
                                        {new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isClosed && updateForm.data.status === feedback.status ? (
                        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                This ticket is {feedback.status}. Change the status above to reopen it before sending a message.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submitUpdate} className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                Message <span className="normal-case text-gray-400">(required to save any change, including status)</span>
                            </p>
                            <textarea
                                value={updateForm.data.message}
                                onChange={(e) => updateForm.setData('message', e.target.value)}
                                placeholder="Write a message to send with this update..."
                                rows={3}
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            {updateForm.errors.message && <p className="text-xs text-red-500">{updateForm.errors.message}</p>}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Tip: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[label](https://example.com)</code> turns into a clickable link.
                            </p>
                            <button
                                type="submit"
                                disabled={updateForm.processing || !updateForm.data.message.trim()}
                                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {updateForm.data.status !== feedback.status ? 'Update Status & Send' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Feedbacks({ feedbacks, filters, categories }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [highlightedTicketId, setHighlightedTicketId] = useState(null);
    const [manageOpen, setManageOpen] = useState(false);

    useEffect(() => {
        const ticketId = new URLSearchParams(window.location.search).get('ticket');
        if (!ticketId) return;
        setHighlightedTicketId(Number(ticketId));
        const scrollTimer = setTimeout(() => {
            document.getElementById(`ticket-${ticketId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        const clearTimer = setTimeout(() => setHighlightedTicketId(null), 3000);
        return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, []);

    const applyFilters = () => {
        router.get(route('admin.feedbacks'), { search, category, status }, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setCategory(''); setStatus('');
        router.get(route('admin.feedbacks'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Feedback</h2>
                </div>
                <button
                    onClick={() => setManageOpen(true)}
                    className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Categories
                </button>
            </div>
        }>
            <Head title="Admin - Feedback" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Search by ID, subject, email..."
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 w-64"
                        />
                        <FilterSelect
                            value={category}
                            onChange={setCategory}
                            className="w-44"
                            options={[
                                { value: '', label: 'All Categories' },
                                ...categories.map((c) => ({ value: c.key, label: c.label })),
                            ]}
                        />
                        <FilterSelect
                            value={status}
                            onChange={setStatus}
                            className="w-44"
                            options={[
                                { value: '', label: 'All Statuses' },
                                ...['pending', 'reviewing', 'accepted', 'rejected', 'closed'].map((s) => ({
                                    value: s,
                                    label: s.charAt(0).toUpperCase() + s.slice(1),
                                })),
                            ]}
                        />
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {(search || category || status) && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {feedbacks.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No feedback found.</p>
                        ) : (
                            feedbacks.data.map((f) => (
                                <FeedbackItem key={f.id} feedback={f} isHighlighted={f.id === highlightedTicketId} categories={categories} />
                            ))
                        )}
                    </div>

                    {feedbacks.last_page > 1 && (
                        <div className="flex justify-center gap-2">
                            {feedbacks.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`rounded-md px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-300'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ManageCategoriesModal show={manageOpen} onClose={() => setManageOpen(false)} categories={categories} />
        </AuthenticatedLayout>
    );
}