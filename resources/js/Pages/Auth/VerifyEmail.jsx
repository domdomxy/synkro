import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function MailIcon() {
    return (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verify Email" />

            <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    <MailIcon />
                </div>

                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verify your email address</h1>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    We sent a verification link to{' '}
                    {auth?.user?.email && <span className="font-medium text-gray-700 dark:text-gray-300">{auth.user.email}</span>}.
                    Click the link to activate your account. If it's not in your inbox, check spam, or request a new one below.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mt-5 flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckIcon />
                    <span>A new verification link has been sent to the email address you provided during registration.</span>
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row-reverse sm:justify-between">
                    <PrimaryButton disabled={processing} className="w-full justify-center sm:w-auto">
                        Resend Verification Email
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-red-600 underline hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-400 dark:hover:text-red-300"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
