import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const features = [
    {
        title: 'Role-based collaboration',
        description: 'Owners, managers, members, and testers each get exactly the permissions that fit their role — per project, not globally. Change roles live, transfer ownership, or leave a project at any time.',
        icon: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H2zm15-9a4 4 0 100-8 4 4 0 000 8zm-1.5 1.5c.49-.13 1-.2 1.5-.2a6 6 0 016 6H17a7.97 7.97 0 00-3.5-6.6V12.5z" />,
    },
    {
        title: 'Full task lifecycle',
        description: 'Tasks flow from todo → in progress → submitted → in review → done. Attach files or links as deliverables, edit submissions before review begins, and get a full tester approval gate before anything is marked complete.',
        icon: <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />,
    },
    {
        title: 'Live notifications',
        description: 'Task assignments, review decisions, role changes, member joins and departures — every meaningful event arrives live via WebSocket. A persistent notification center with category and read/unread filters keeps you in control.',
        icon: <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
    {
        title: 'Activity logs',
        description: 'Every action on a project is logged — member changes, role updates, task edits, ownership transfers. Owners and managers can filter by user or action type to audit the full project history.',
        icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />,
    },
    {
        title: 'Personal dashboard',
        description: 'A full activity chart, deadline calendar with week/month/year views, due-soon alerts, task status breakdown, and personal reminders — everything you need to stay organized.',
        icon: <path d="M16 8v8m-4-5v5m-4-2v2M4 20h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v13a1 1 0 001 1z" />,
    },
    {
        title: 'Platform admin',
        description: 'A dedicated admin panel for managing users and overseeing platform activity — activate, deactivate, or change global roles — separate from project-level permissions.',
        icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zm0 4.2L7 8.5v3.7c0 3.4 2.3 6.1 5 7.2 2.7-1.1 5-3.8 5-7.2V8.5l-5-2.3z" />,
    },
];

const categoryOptions = [
    { value: 'bug', label: '🐛 Bug Report' },
    { value: 'help', label: '🙋 Help Request' },
    { value: 'report', label: '🚩 Report User/Content' },
    { value: 'question', label: '❓ Question' },
    { value: 'suggestion', label: '💡 Suggestion' },
    { value: 'other', label: '📝 Other' },
];

const statusStyles = {
    pending: 'bg-gray-100 text-gray-700',
    reviewing: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    closed: 'bg-gray-200 text-gray-500',
};

function FeedbackSection({ flash }) {
    const [activeTab, setActiveTab] = useState('submit');
    const [trackingId, setTrackingId] = useState('');
    const [trackResult, setTrackResult] = useState(null);
    const [trackLoading, setTrackLoading] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: '',
        attachment: null,
    });

    useEffect(() => {
        if (flash?.feedback_tracking_id) {
            setSubmitted(flash.feedback_tracking_id);
            reset();
            setPreviewUrl(null);
        }
    }, [flash]);

    const submitFeedback = (e) => {
        e.preventDefault();
        post(route('feedback.store'), { forceFormData: true });
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('attachment', file);
        setPreviewUrl(URL.createObjectURL(file));
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
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
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

    return (
        <section className="mx-auto max-w-3xl px-6 pb-24">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contact & Feedback</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Report a bug, ask a question, or share a suggestion. We read everything.</p>
            </div>

            <div className="flex rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`flex-1 rounded-l-lg py-3 text-sm font-medium transition ${activeTab === 'submit' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                >
                    Submit Feedback
                </button>
                <button
                    onClick={() => setActiveTab('track')}
                    className={`flex-1 rounded-r-lg py-3 text-sm font-medium transition ${activeTab === 'track' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                >
                    Track Status
                </button>
            </div>

            <div className="mt-4 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
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
                            <div className="mx-auto mt-2 w-fit rounded-lg bg-indigo-50 px-6 py-3 font-mono text-xl font-bold tracking-widest text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {submitted}
                            </div>
                            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Save this ID to track your feedback status.</p>
                            <button
                                onClick={() => setSubmitted(null)}
                                className="mt-4 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Submit another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submitFeedback} className="space-y-4">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                >
                                    <option value="">Select a category...</option>
                                    {categoryOptions.map((c) => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
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
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Screenshot / Attachment <span className="text-gray-400">(optional)</span></label>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-400"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {data.attachment ? data.attachment.name : 'Attach a screenshot'}
                                </button>
                                {previewUrl && (
                                    <div className="relative mt-2 w-fit">
                                        <img src={previewUrl} alt="Preview" className="h-24 rounded-md object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setData('attachment', null); setPreviewUrl(null); fileInputRef.current.value = ''; }}
                                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                                        >×</button>
                                    </div>
                                )}
                                {errors.attachment && <p className="mt-1 text-xs text-red-500">{errors.attachment}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-md bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {processing ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </form>
                    )
                ) : (
                    <div>
                        <form onSubmit={trackFeedback} className="flex gap-2">
                            <input
                                type="text"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                                placeholder="Enter your tracking ID (e.g. ABC-1234-XYZ)"
                                className="flex-1 rounded-md border-gray-300 font-mono text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            <button
                                type="submit"
                                disabled={trackLoading}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {trackLoading ? '...' : 'Track'}
                            </button>
                        </form>

                        {trackResult && (
                            <div className="mt-4">
                                {!trackResult.found ? (
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">No feedback found with that ID. Double-check and try again.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{trackResult.feedback.subject}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        {trackResult.feedback.tracking_id} · {categoryOptions.find((c) => c.value === trackResult.feedback.category)?.label}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[trackResult.feedback.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {trackResult.feedback.status}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{trackResult.feedback.message}</p>
                                            {trackResult.feedback.attachment_path && (
                                                <a href={`/storage/${trackResult.feedback.attachment_path}`} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                                                    View attachment
                                                </a>
                                            )}
                                        </div>

                                        {trackResult.feedback.responses?.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Admin Responses:</p>
                                                <div className="space-y-2">
                                                    {trackResult.feedback.responses.map((r) => (
                                                        <div key={r.id} className="rounded-md bg-indigo-50 p-3 dark:bg-indigo-950/30">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{r.message}</p>
                                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                                {r.admin?.name} · {new Date(r.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function Welcome({ auth, flash }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xl font-bold">Synkro</span>
                    </div>
                    <nav>
                        {auth.user ? (
                            <Link href={route('projects.index')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                                Projects
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href={route('login')} className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                                    Log in
                                </Link>
                                <Link href={route('register')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>
                </header>

                <main>
                    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                            Plan projects. Assign tasks. <span className="text-indigo-600 dark:text-indigo-400">Ship work, together.</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                            Synkro is a collaborative project and task management platform with real review workflows, live notifications, activity logs, deadline calendars, and personal reminders — built for teams that actually want to ship.
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                {auth.user ? (
                                    <>
                                        <Link href={route('projects.index')} className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500">
                                            Go to Projects
                                        </Link>
                                        <Link href={route('feedback.page')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                            Help / Feedback
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href={route('register')} className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500">
                                            Create an Account
                                        </Link>
                                        <Link href={route('login')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                            Log in
                                        </Link>
                                        <Link href={route('feedback.page')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                            Help / Feedback
                                        </Link>
                                    </>
                                )}
                            </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-6 pb-16">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.title} className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="currentColor">
                                        {feature.icon}
                                    </svg>
                                    <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
                    Synkro was built as a PFA project at Kernel Solution &amp; Innovation
                </footer>
            </div>
        </>
    );
}