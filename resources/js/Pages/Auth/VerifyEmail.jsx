import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import OtpInput from '@/Components/Auth/OtpInput';
import ResendCodeButton from '@/Components/Auth/ResendCodeButton';
import { MailIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

// Client-side courtesy cooldown so the resend button can't be mashed. The
// backend's own throttle:6,1 on the verification.send route is what
// actually enforces a hard limit.
const RESEND_COOLDOWN_SECONDS = 20;

export default function VerifyEmail({ status }) {
    const { auth } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({ code: '' });
    const [justSent, setJustSent] = useState(status === 'verification-code-sent');

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.verify'), {
            onError: () => reset('code'),
        });
    };

    const resend = () =>
        new Promise((resolve, reject) => {
            router.post(
                route('verification.send'),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setJustSent(true);
                        reset('code');
                        resolve();
                    },
                    onError: () => reject(),
                },
            );
        });

    return (
        <GuestLayout
            icon={MailIcon}
            eyebrow="One more step"
            title="Verify your email address"
            subtitle={
                <>
                    We sent a 6-digit code to{' '}
                    {auth?.user?.email && <span className="font-medium text-gray-700 dark:text-gray-300">{auth.user.email}</span>}.
                    Enter it below to activate your account. If it's not in your inbox, check spam.
                </>
            }
            align="center"
        >
            <Head title="Verify Email" />

            {justSent && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>A new code has been sent to your email address.</span>
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <OtpInput
                    length={6}
                    value={data.code}
                    onChange={(code) => setData('code', code)}
                    error={errors.code}
                    autoFocus
                    disabled={processing}
                />

                <PrimaryButton
                    type="submit"
                    className="w-full justify-center py-2.5"
                    disabled={processing || data.code.length !== 6}
                >
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Verifying...' : 'Verify Email'}
                </PrimaryButton>

                <div className="flex flex-col items-center gap-4 pt-1 sm:flex-row-reverse sm:items-start sm:justify-between">
                    <ResendCodeButton onResend={resend} cooldownSeconds={RESEND_COOLDOWN_SECONDS} label="Resend Verification Code" />

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
