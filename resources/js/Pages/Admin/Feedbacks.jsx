import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import BackButton from '@/Components/BackButton';

const categoryConfig = {
    bug: {
        label: 'Bug Report',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    help: {
        label: 'Help Request',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    report: {
        label: 'Report',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H11l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
    },
    question: {
        label: 'Question',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    suggestion: {
        label: 'Suggestion',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    other: {
        label: 'Other',
        icon: (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
        ),
    },
};

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400',
};

function CategoryBadge({ category }) {
    const config = categoryConfig[category];
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {config?.icon}
            {config?.label ?? category}
        </span>
    );
}

function FeedbackItem({ feedback }) {
    const [open, setOpen] = useState(false);
    const responseForm = useForm({ message: '' });
    const isClosed = ['closed', 'rejected'].includes(feedback.status);
    const userReplyCount = feedback.responses?.filter((r) => r.sender_type === 'user').length ?? 0;

    const updateStatus = (status) => {
        router.patch(route('admin.feedbacks.status', feedback.id), { status }, { preserveScroll: true });
    };

    const submitResponse = (e) => {
        e.preventDefault();
        responseForm.post(route('admin.feedbacks.respond', feedback.id), {
            preserveScroll: true,
            onSuccess: () => responseForm.reset(),
        });
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{feedback.subject}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[feedback.status]}`}>
                            {feedback.status}
                        </span>
                        <CategoryBadge category={feedback.category} />
                        {userReplyCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {userReplyCount} user repl{userReplyCount > 1 ? 'ies' : 'y'}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span>{feedback.name} ({feedback.email})</span>
                        <span>ID: {feedback.tracking_id}</span>
                        <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
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
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Original message</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feedback.message}</p>
                    </div>

                    {(feedback.attachment_path || feedback.attachments?.length > 0) && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Attachments {feedback.attachments?.length > 0 && `(${feedback.attachments.length + (feedback.attachment_path ? 1 : 0)})`}:
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                            {['pending', 'reviewing', 'accepted', 'rejected', 'closed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateStatus(s)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                                        feedback.status === s
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {isClosed && (
                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                This ticket is {feedback.status} — the user can no longer reply. Reopen by changing the status if needed.
                            </p>
                        )}
                    </div>

                    {feedback.responses?.length > 0 && (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Conversation</p>
                            <div className="space-y-2">
                                {feedback.responses.map((r) => (
                                    <div
                                        key={r.id}
                                        className={`rounded-md p-3 ${
                                            r.sender_type === 'admin'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/30'
                                                : 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                                        }`}
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{r.message}</p>
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            {r.sender_type === 'admin' ? (r.admin?.name ?? 'Admin') : feedback.name}
                                            {r.sender_type === 'user' && <span className="ml-1 italic">(user)</span>}
                                            {' · '}
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isClosed ? (
                        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-900/50">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                This ticket is {feedback.status}. Change the status above to reopen it before replying.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submitResponse} className="space-y-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Send Response</p>
                            <textarea
                                value={responseForm.data.message}
                                onChange={(e) => responseForm.setData('message', e.target.value)}
                                placeholder="Write a response to this feedback..."
                                rows={3}
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            {responseForm.errors.message && <p className="text-xs text-red-500">{responseForm.errors.message}</p>}
                            <button
                                type="submit"
                                disabled={responseForm.processing}
                                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                Send Response
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Feedbacks({ feedbacks, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [category, setCategory] = useState(filters.category ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = () => {
        router.get(route('admin.feedbacks'), { search, category, status }, { preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setCategory(''); setStatus('');
        router.get(route('admin.feedbacks'));
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Feedback</h2>
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
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">All Categories</option>
                            {Object.entries(categoryConfig).map(([v, { label }]) => (
                                <option key={v} value={v}>{label}</option>
                            ))}
                        </select>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">All Statuses</option>
                            {['pending', 'reviewing', 'accepted', 'rejected', 'closed'].map((s) => (
                                <option key={s} value={s} className="capitalize">{s}</option>
                            ))}
                        </select>
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {(search || category || status) && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {feedbacks.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No feedback found.</p>
                        ) : (
                            feedbacks.data.map((f) => <FeedbackItem key={f.id} feedback={f} />)
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
        </AuthenticatedLayout>
    );
}