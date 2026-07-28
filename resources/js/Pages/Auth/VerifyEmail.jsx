import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import { MailIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Client-side only - a courtesy cooldown so the button can't be mashed. The backend's
// own throttle:6,1 on the verification.send route is what actually enforces a limit.
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm({});
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, [cooldown > 0]);

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'), {
            onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS),
        });
    };

    return (
        <GuestLayout
            icon={MailIcon}
            eyebrow="One more step"
            title="Verify your email address"
            subtitle={
                <>
                    We sent a verification link to{' '}
                    {auth?.user?.email && <span className="font-medium text-gray-700 dark:text-gray-300">{auth.user.email}</span>}.
                    Click the link to activate your account. If it's not in your inbox, check spam, or request a new one below.
                </>
            }
            align="center"
        >
            <Head title="Verify Email" />

            {status === 'verification-link-sent' && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>A new verification link has been sent to the email address you provided during registration.</span>
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row-reverse sm:justify-between">
                    <PrimaryButton disabled={processing || cooldown > 0} className="w-full justify-center sm:w-auto">
                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                        {processing ? 'Sending...' : cooldown > 0 ? `Resend Verification Email (${cooldown}s)` : 'Resend Verification Email'}
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
