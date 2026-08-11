import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useContext, useEffect, useRef, useState } from 'react';
import Dropdown, { DropDownContext } from '@/Components/Dropdown';
import BackButton from '@/Components/BackButton';
import Spinner from '@/Components/Spinner';
import Linkify from '@/Components/Linkify';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import CategoryIcon, { resolveCategory } from '@/Components/CategoryIcon';
import ManageCategoriesModal from '@/Components/ManageCategoriesModal';
import ImageLightbox from '@/Components/ImageLightbox';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import AdminGuideDrawer from '@/Components/AdminGuideDrawer';

const FEEDBACK_GUIDE_SECTIONS = [
    {
        heading: 'Status meanings',
        tone: 'neutral',
        items: [
            'Pending: not yet triaged, this is the default for new tickets.',
            "Reviewing: set this as soon as you start looking into it, so the user knows it's not stuck.",
            "Accepted: the report or request is valid and will be acted on, it doesn't require a fix to already exist.",
            "Rejected: won't be actioned, always include a reason so the user understands why.",
            'Closed: resolved, or no further action needed. This also happens automatically after 24h of inactivity.',
        ],
    },
    {
        heading: 'Before you reply',
        tone: 'neutral',
        items: [
            "Read every message in the thread, not just the latest one. The user may have already answered a question you're about to ask.",
            'Check attached screenshots or files before assuming you understand the issue.',
            'Search for similar tickets if the description sounds familiar, duplicates should be tied together in your response.',
        ],
    },
    {
        heading: 'Good vs. weak responses',
        tone: 'example',
        items: [
            { label: 'Good', text: "Thanks for the report. I can reproduce this on the mobile view, the button overlaps the header on smaller screens. I've filed it and will update this ticket when it's fixed." },
            { label: 'Weak', text: '"will look into it" does not confirm the issue was understood and gives no timeframe.' },
            { label: 'Good (rejecting)', text: "Appreciate the suggestion. Dark mode isn't on the roadmap right now, we're focused on the mobile app changes first. I'll close this for now, feel free to open a new ticket if priorities change." },
            { label: 'Weak (rejecting)', text: '"not doing this" is dismissive and does not explain the reasoning or leave the door open.' },
        ],
    },
    {
        heading: 'Handling different ticket types',
        tone: 'scenario',
        items: [
            "Bug report: confirm you can reproduce it, or explain why you can't, before accepting or rejecting it.",
            "Feature suggestion: it's fine to reject respectfully, just explain the reasoning (roadmap, scope, etc.) instead of leaving it unexplained.",
            "Complaint about another user or admin: don't share names or account details in your reply, handle the underlying issue separately if needed.",
            'Repeat message on a closed ticket: reopen it (change the status) before replying, replying without changing the status can look like the message was ignored.',
        ],
    },
    {
        heading: 'Do',
        tone: 'do',
        items: [
            'Confirm what you understood the issue to be before answering.',
            'Give a concrete next step or timeframe when you can.',
            'Update the status when you reply so the ticket reflects reality.',
            "Thank the user for reporting or suggesting something, even when you're rejecting it.",
        ],
    },
    {
        heading: "Don't",
        tone: 'dont',
        items: [
            "Don't share other users' information, even to explain a bug.",
            "Don't close a ticket without a message explaining why.",
            "Don't guess at a fix you haven't confirmed, say you're checking instead.",
            'Don\'t leave a ticket in "reviewing" for days without an update, the user has no way to know it\'s still active.',
        ],
    },
];

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    closed: 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400',
};

// Menu entry for the header's merged "Manage Categories" / "Guide" dropdown.
// Dropdown.Content just renders whatever children it's given - it doesn't wire
// them to close the panel itself (Dropdown.Link only does that via an Inertia
// navigation). These two actions just flip local state instead of navigating,
// so this reaches into the same DropDownContext the Trigger/Content use to
// close the menu on click before running the action.
function HeaderMenuButton({ onClick, icon, children }) {
    const { setOpen } = useContext(DropDownContext);
    return (
        <button
            type="button"
            onClick={() => { setOpen(false); onClick(); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
        >
            <span className="text-gray-400 dark:text-gray-500">{icon}</span>
            {children}
        </button>
    );
}

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
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const updateForm = useForm({ status: feedback.status, message: '' });
    const isClosed = ['closed', 'rejected'].includes(feedback.status);
    const userReplyCount = feedback.responses?.filter((r) => r.sender_type === 'user').length ?? 0;

    // Flattened so the lightbox can page through every attachment on this
    // ticket (legacy single attachment_path + the newer attachments array)
    // with one shared index, regardless of which field they came from.
    const attachmentImages = [
        ...(feedback.attachment_path ? [{ src: `/storage/${feedback.attachment_path}`, alt: 'Attachment' }] : []),
        ...(feedback.attachments ?? []).map((att) => ({ src: `/storage/${att.path}`, alt: att.original_name })),
    ];

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
                isHighlighted ? 'border-indigo-400 ring-2 ring-indigo-400 dark:border-indigo-500 dark:ring-indigo-500 task-highlight-ring' : 'border-gray-200 dark:border-gray-700'
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

                                {attachmentImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {attachmentImages.map((img, i) => (
                                            <button
                                                key={img.src}
                                                type="button"
                                                onClick={() => setLightboxIndex(i)}
                                                title={img.alt}
                                                className="group relative overflow-hidden rounded-md shadow"
                                            >
                                                <img src={img.src} alt={img.alt} className="h-24 w-full object-cover transition group-hover:brightness-90" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <ImageLightbox
                                    images={attachmentImages}
                                    index={lightboxIndex}
                                    onClose={() => setLightboxIndex(null)}
                                    onIndexChange={setLightboxIndex}
                                />

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
                                            : r.sender_type === 'system'
                                                ? 'border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40'
                                                : 'border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                                    }`}
                                >
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"><Linkify text={r.message} /></p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        {r.sender_type === 'admin' ? (r.admin?.name ?? 'Admin') : r.sender_type === 'system' ? 'Synkro (automated)' : feedback.name}
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
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {updateForm.processing && <Spinner className="mr-2 h-4 w-4" />}
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
    const [guideOpen, setGuideOpen] = useState(false);
    const toolbarRef = useRef(null);

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
        router.get(route('admin.feedbacks'), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Feedback</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75h.007v.008H12V6.75Zm0 5.25h.007v.008H12V12Zm0 5.25h.007v.008H12v-.008Z" />
                                </svg>
                                <span className="hidden sm:inline">Actions</span>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="56">
                            <HeaderMenuButton
                                onClick={() => setManageOpen(true)}
                                icon={
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                }
                            >
                                Manage Categories
                            </HeaderMenuButton>
                            <HeaderMenuButton
                                onClick={() => setGuideOpen(true)}
                                icon={
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                }
                            >
                                Guide
                            </HeaderMenuButton>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>
        }>
            <Head title="Admin - Feedback" />
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-8xl space-y-6 px-3 sm:px-6 lg:px-8">
                    <div ref={toolbarRef} className="flex flex-wrap items-end gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Search by ID, subject, email..."
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 w-64"
                        />
                        <FiltersMenu
                            activeCount={[Boolean(category), Boolean(status)].filter(Boolean).length}
                            onApply={applyFilters}
                            onClear={clearFilters}
                            hasActiveFilters={Boolean(search || category || status)}
                        >
                            <FiltersMenu.Row label="Category">
                                <FilterSelect
                                    value={category}
                                    onChange={setCategory}
                                    className="w-full"
                                    options={[
                                        { value: '', label: 'All Categories' },
                                        ...categories.map((c) => ({ value: c.key, label: c.label })),
                                    ]}
                                />
                            </FiltersMenu.Row>
                            <FiltersMenu.Row label="Status">
                                <FilterSelect
                                    value={status}
                                    onChange={setStatus}
                                    className="w-full"
                                    options={[
                                        { value: '', label: 'All Statuses' },
                                        ...['pending', 'reviewing', 'accepted', 'rejected', 'closed'].map((s) => ({
                                            value: s,
                                            label: s.charAt(0).toUpperCase() + s.slice(1),
                                        })),
                                    ]}
                                />
                            </FiltersMenu.Row>
                        </FiltersMenu>
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

            <AdminGuideDrawer
                show={guideOpen}
                onClose={() => setGuideOpen(false)}
                title="Ticket Response Guide"
                intro="Reference for keeping support replies consistent."
                sections={FEEDBACK_GUIDE_SECTIONS}
            />

            <ScrollToPaginationButton targetRef={toolbarRef} />
        </AuthenticatedLayout>
    );
}