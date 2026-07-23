import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Spinner from '@/Components/Spinner';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Linkify from '@/Components/Linkify';
import AuthField from '@/Components/Auth/AuthField';
import { MailIcon, LockIcon, ClockIcon, BanIcon } from '@/Components/Auth/icons';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function timeRemaining(dateString) {
    const ms = new Date(dateString) - new Date();
    if (ms <= 0) return null;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
}

function SuspensionNotice({ suspension }) {
    const [showAppeal, setShowAppeal] = useState(false);
    const appealForm = useForm({ email: suspension?.email ?? '', message: '' });

    const submitAppeal = (e) => {
        e.preventDefault();
        appealForm.post(route('appeal.store'), {
            onSuccess: () => appealForm.reset('message'),
        });
    };

    const { passwordExpired, flash } = usePage().props;
    const justSubmitted = appealForm.recentlySuccessful || Boolean(flash?.success);
    const hasAppealFeedback = justSubmitted || Boolean(
        appealForm.errors.limit || appealForm.errors.email || appealForm.errors.message
    );

    if (passwordExpired) {
        return (
            <div className="w-full max-w-md">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <h3 className="text-base font-semibold text-amber-700 dark:text-amber-400">Your temporary password has expired</h3>
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
                        Please contact an administrator to request a new one.
                    </p>
                </div>
            </div>
        );
    }

    const remaining = !suspension.permanent ? timeRemaining(suspension.until) : null;

    return (
        <div className="w-full max-w-md">
            <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Suspended</h1>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    You won't be able to sign in while this is active.
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div
                    className={`flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700 ${
                        suspension.permanent ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-amber-50/60 dark:bg-amber-950/20'
                    }`}
                >
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            suspension.permanent
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                        }`}
                    >
                        {suspension.permanent ? <BanIcon className="h-5 w-5" /> : <ClockIcon className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {suspension.permanent ? 'Permanent suspension' : 'Temporary suspension'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {suspension.permanent
                                ? 'This account will not be automatically reinstated.'
                                : `Lifts ${new Date(suspension.until).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}`}
                        </p>
                    </div>
                    {!suspension.permanent && remaining && (
                        <span className="ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                            {remaining}
                        </span>
                    )}
                </div>

                {suspension.reason && (
                    <div className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Reason given
                        </p>
                        <div className="mt-2 rounded-md border-l-2 border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/40">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                <Linkify text={suspension.reason} />
                            </p>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
                    {!showAppeal && !hasAppealFeedback ? (
                        <button
                            onClick={() => setShowAppeal(true)}
                            className="flex w-full items-center justify-between text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                        >
                            <span>Think this was a mistake?</span>
                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                Submit an appeal
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </button>
                    ) : justSubmitted ? (
                        <div className="flex items-start gap-2.5 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-green-700 dark:text-green-400">
                                {flash?.success || "Appeal submitted. We'll review it and get back to you as soon as possible."}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submitAppeal} className="space-y-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Submit an appeal</p>
                            {appealForm.errors.limit && (
                                <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                    <p className="text-sm text-red-700 dark:text-red-400">{appealForm.errors.limit}</p>
                                </div>
                            )}
                            <div>
                                <InputLabel htmlFor="appeal-email" value="Account email" className="text-xs" />
                                <TextInput
                                    id="appeal-email"
                                    type="email"
                                    value={appealForm.data.email}
                                    disabled
                                    className="mt-1 block w-full cursor-not-allowed bg-gray-50 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                />
                                <InputError message={appealForm.errors.email} className="mt-1" />
                            </div>
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <InputLabel htmlFor="appeal-message" value="Why should this be lifted?" className="text-xs" />
                                    <span className="shrink-0 pl-3 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                                        {appealForm.data.message.length}/2000
                                    </span>
                                </div>
                                <textarea
                                    id="appeal-message"
                                    value={appealForm.data.message}
                                    onChange={(e) => appealForm.setData('message', e.target.value)}
                                    rows={3}
                                    maxLength={2000}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    placeholder="Give us some context..."
                                />
                                <InputError message={appealForm.errors.message} className="mt-1" />
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                                <PrimaryButton
                                    disabled={
                                        appealForm.processing ||
                                        !!appealForm.errors.limit ||
                                        !appealForm.data.message.trim()
                                    }
                                >
                                    {appealForm.processing && <Spinner className="mr-2 h-3.5 w-3.5" />}
                                    {appealForm.processing ? 'Sending...' : 'Submit Appeal'}
                                </PrimaryButton>
                                <button
                                    type="button"
                                    onClick={() => setShowAppeal(false)}
                                    className="text-sm text-gray-500 hover:underline dark:text-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                You can submit one appeal every 6 hours per account.
                            </p>
                        </form>
                    )}
                </div>
            </div>

            <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
                <Link href={route('login')} className="hover:underline">
                    Back to login
                </Link>
            </p>
        </div>
    );
}

export default function Login({ status, canResetPassword }) {
    const { suspension } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    if (suspension) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 dark:bg-gray-900">
                <Head title="Account Suspended" />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-red-400/10 blur-3xl dark:bg-red-500/10"
                />
                <Link href="/" className="relative mb-8 flex items-center gap-2">
                    <ApplicationLogo className="h-9 w-9 fill-current text-indigo-600 dark:text-indigo-400" />
                </Link>
                <SuspensionNotice suspension={suspension} />
            </div>
        );
    }

    return (
        <AuthSplitLayout
            eyebrow="Welcome back"
            title="Sign in to Synkro"
            subtitle="Enter your email and password to get back to your projects."
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    id="email"
                    label="Email"
                    type="email"
                    name="email"
                    icon={MailIcon}
                    value={data.email}
                    autoComplete="username"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    name="password"
                    icon={LockIcon}
                    value={data.password}
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </div>

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Signing in...' : 'Log in'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Not registered yet?{' '}
                <Link href={route('register')} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Create an account
                </Link>
            </p>
        </AuthSplitLayout>
    );
}
