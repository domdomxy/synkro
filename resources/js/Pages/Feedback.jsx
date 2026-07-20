import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Linkify from '@/Components/Linkify';
import { useEffect, useRef, useState } from 'react';

const categoryOptions = [
    {
        value: 'bug',
        label: 'Bug Report',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        value: 'help',
        label: 'Help Request',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        value: 'report',
        label: 'Report User/Content',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H11l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
    },
    {
        value: 'question',
        label: 'Question',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    {
        value: 'suggestion',
        label: 'Suggestion',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    {
        value: 'other',
        label: 'Other',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
        ),
    },
];

const statusConfig = {
    pending: {
        label: 'Pending',
        style: 'bg-gray-100 text-gray-700',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    reviewing: {
        label: 'Under Review',
        style: 'bg-blue-100 text-blue-700',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
    },
    accepted: {
        label: 'Accepted',
        style: 'bg-green-100 text-green-700',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
    rejected: {
        label: 'Rejected',
        style: 'bg-red-100 text-red-700',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
    closed: {
        label: 'Closed',
        style: 'bg-gray-200 text-gray-500',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
        ),
    },
};

function getCsrfToken() {
    return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
}

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function ReplyBox({ feedback, trackingId, email, onReplySent }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const hasAdminResponse = feedback.responses?.some((r) => r.sender_type === 'admin');
    const isClosed = ['closed', 'rejected'].includes(feedback.status);

    if (isClosed) {
        return (
            <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                This ticket is {feedback.status} and no longer accepts replies.
            </p>
        );
    }

    if (!hasAdminResponse) {
        return (
            <p className="rounded-md bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                You'll be able to reply once our team responds to this ticket.
            </p>
        );
    }

    const submit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setSending(true);
        setError(null);
        try {
            const res = await fetch(route('feedback.reply'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ tracking_id: trackingId, email, message }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? 'Something went wrong.');
            } else {
                onReplySent(json.response);
                setMessage('');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Write a reply..."
                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500">
                Tip: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[label](https://example.com)</code> turns into a clickable link.
            </p>
            <button
                type="submit"
                disabled={sending || !message.trim()}
                className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
                {sending ? 'Sending...' : 'Send Reply'}
            </button>
        </form>
    );
}

function TicketActions({ feedback, trackingId, email, onStatusChanged }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isClosed = feedback.status === 'closed';
    const isRejected = feedback.status === 'rejected';

    if (isRejected) return null; // rejected tickets stay rejected, no reopen path

    const callEndpoint = async (routeName) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(route(routeName), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ tracking_id: trackingId, email }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error ?? 'Something went wrong.');
            } else {
                onStatusChanged(json.status);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isClosed ? 'This ticket is closed.' : 'Resolved your issue?'}
                </p>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            {isClosed ? (
                <button
                    onClick={() => callEndpoint('feedback.reopen')}
                    disabled={loading}
                    className="flex shrink-0 items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
                    </svg>
                    {loading ? 'Reopening...' : 'Reopen Ticket'}
                </button>
            ) : (
                <button
                    onClick={() => callEndpoint('feedback.close')}
                    disabled={loading}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? 'Closing...' : 'Close Ticket'}
                </button>
            )}
        </div>
    );
}

export default function Feedback({ flash }) {
    const [activeTab, setActiveTab] = useState('submit');
    const [trackingId, setTrackingId] = useState('');
    const [trackResult, setTrackResult] = useState(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [previews, setPreviews] = useState([]); // [{ file, url }]
    const fileInputRef = useRef(null);

    const MAX_ATTACHMENTS = 5;

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: '',
        attachments: [],
    });

    useEffect(() => {
        if (flash?.feedback_tracking_id) {
            setSubmitted(flash.feedback_tracking_id);
            reset();
            previews.forEach((p) => URL.revokeObjectURL(p.url));
            setPreviews([]);
        }
    }, [flash]);

    const submitFeedback = (e) => {
        e.preventDefault();
        post(route('feedback.store'), { forceFormData: true });
    };

    const onFilesChange = (e) => {
        const incoming = Array.from(e.target.files);
        const room = MAX_ATTACHMENTS - data.attachments.length;
        const accepted = incoming.slice(0, room);

        setData('attachments', [...data.attachments, ...accepted]);
        setPreviews((prev) => [
            ...prev,
            ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ]);
        e.target.value = '';
    };

    const removeAttachment = (index) => {
        URL.revokeObjectURL(previews[index].url);
        setData('attachments', data.attachments.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const trackFeedback = async (e) => {
        e.preventDefault();
        if (!trackingId.trim()) return;
        setTrackLoading(true);
        setTrackResult(null);
        try {
            const res = await fetch(route('feedback.track'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ tracking_id: trackingId }),
            });
            const json = await res.json();
            setTrackResult(json);
        } catch {
            setTrackResult({ found: false });
        } finally {
            setTrackLoading(false);
        }
    };

    const appendReply = (response) => {
        setTrackResult((prev) => ({
            ...prev,
            feedback: {
                ...prev.feedback,
                responses: [...(prev.feedback.responses ?? []), response],
            },
        }));
    };

    const updateStatus = (newStatus) => {
        setTrackResult((prev) => ({
            ...prev,
            feedback: { ...prev.feedback, status: newStatus },
        }));
    };

    const selectedCategory = categoryOptions.find((c) => c.value === data.category);

    return (
        <>
            <Head title="Help & Feedback" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xl font-bold">Synkro</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </header>

                <main className="mx-auto max-w-2xl px-6 py-10">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Help & Feedback</h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Report a bug, ask a question, or share a suggestion. We read and respond to everything.
                        </p>
                    </div>

                    <div className="mb-6 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('submit')}
                            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition ${
                                activeTab === 'submit'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Submit Feedback
                        </button>
                        <button
                            onClick={() => setActiveTab('track')}
                            className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition ${
                                activeTab === 'track'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Track Status
                        </button>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        {activeTab === 'submit' ? (
                            submitted ? (
                                <div className="py-8 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Feedback received!</h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your tracking ID is:</p>
                                    <div className="mx-auto mt-3 w-fit rounded-lg bg-indigo-50 px-6 py-3 font-mono text-xl font-bold tracking-widest text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {submitted}
                                    </div>
                                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                                        Save this ID so you can use it to track your feedback status anytime.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(null)}
                                        className="mt-5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                    >
                                        Submit Another
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={submitFeedback} className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                placeholder="Your name"
                                            />
                                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                placeholder="you@example.com"
                                            />
                                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {categoryOptions.map((c) => (
                                                <button
                                                    key={c.value}
                                                    type="button"
                                                    onClick={() => setData('category', c.value)}
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                                        data.category === c.value
                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {c.icon}
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                                        <input
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            placeholder="Brief summary of your feedback"
                                        />
                                        {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                                        <textarea
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            rows={5}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            placeholder="Describe your feedback in detail..."
                                        />
                                        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            Tip: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">[label](https://example.com)</code> turns into a clickable link.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Screenshots <span className="text-gray-400 font-normal">(optional, up to {MAX_ATTACHMENTS})</span>
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={onFilesChange}
                                            className="hidden"
                                        />
                                        {previews.length < MAX_ATTACHMENTS && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                className="mt-1 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 py-3 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {previews.length > 0
                                                    ? `Add more (${previews.length}/${MAX_ATTACHMENTS})`
                                                    : 'Click to attach screenshots'}
                                            </button>
                                        )}
                                        {previews.length > 0 && (
                                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                {previews.map((p, i) => (
                                                    <div key={i} className="group relative">
                                                        <img src={p.url} alt={p.file.name} className="h-20 w-full rounded-md object-cover shadow" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(i)}
                                                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                                                        >
                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                        <p className="mt-0.5 truncate text-[10px] text-gray-400 dark:text-gray-500">{formatBytes(p.file.size)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.attachments && <p className="mt-1 text-xs text-red-500">{errors.attachments}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Feedback
                                            </>
                                        )}
                                    </button>
                                </form>
                            )
                        ) : (
                            <div className="space-y-4">
                                <form onSubmit={trackFeedback} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={trackingId}
                                            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                                            placeholder="e.g. ABC-1234-XYZ"
                                            className="block w-full rounded-md border-gray-300 pl-9 font-mono text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={trackLoading}
                                        className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {trackLoading ? '...' : 'Track'}
                                    </button>
                                </form>

                                {trackResult && (
                                    trackResult.found === false ? (
                                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                                            <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-red-700 dark:text-red-400">No feedback found with that ID. Please check and try again.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{trackResult.feedback.subject}</p>
                                                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                            {trackResult.feedback.tracking_id} ·{' '}
                                                            {categoryOptions.find((c) => c.value === trackResult.feedback.category)?.label}
                                                        </p>
                                                    </div>
                                                    {(() => {
                                                        const s = statusConfig[trackResult.feedback.status];
                                                        return s ? (
                                                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${s.style}`}>
                                                                {s.icon}
                                                                {s.label}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400"><Linkify text={trackResult.feedback.message} /></p>

                                                {(trackResult.feedback.attachment_path || trackResult.feedback.attachments?.length > 0) && (
                                                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                        {trackResult.feedback.attachment_path && (
                                                            <a href={`/storage/${trackResult.feedback.attachment_path}`} target="_blank" rel="noreferrer">
                                                                <img src={`/storage/${trackResult.feedback.attachment_path}`} alt="attachment" className="h-20 w-full rounded-md object-cover shadow" />
                                                            </a>
                                                        )}
                                                        {trackResult.feedback.attachments?.map((att) => (
                                                            <a key={att.id} href={`/storage/${att.path}`} target="_blank" rel="noreferrer">
                                                                <img src={`/storage/${att.path}`} alt={att.original_name} className="h-20 w-full rounded-md object-cover shadow" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {trackResult.feedback.responses?.length > 0 && (
                                                <div>
                                                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Conversation</p>
                                                    <div className="space-y-2">
                                                        {trackResult.feedback.responses.map((r) => (
                                                            <div
                                                                key={r.id}
                                                                className={`rounded-lg border p-3 ${
                                                                    r.sender_type === 'admin'
                                                                        ? 'border-indigo-100 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30'
                                                                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50'
                                                                }`}
                                                            >
                                                                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300"><Linkify text={r.message} /></p>
                                                                <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                    {r.sender_type === 'admin' ? 'Support Team' : 'You'} ·{' '}
                                                                    {new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <TicketActions
                                                feedback={trackResult.feedback}
                                                trackingId={trackingId}
                                                email={trackResult.feedback.email}
                                                onStatusChanged={updateStatus}
                                            />

                                            <div>
                                                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Reply</p>
                                                <ReplyBox
                                                    feedback={trackResult.feedback}
                                                    trackingId={trackingId}
                                                    email={trackResult.feedback.email}
                                                    onReplySent={appendReply}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}