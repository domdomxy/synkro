import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import AuthField from '@/Components/Auth/AuthField';
import OtpInput from '@/Components/Auth/OtpInput';
import ResendCodeButton from '@/Components/Auth/ResendCodeButton';
import PasswordStrengthMeter from '@/Components/PasswordStrengthMeter';
import { MailIcon, LockIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

// Client-side courtesy cooldown so the resend button can't be mashed. The
// backend's own throttle:6,1 on the password.email route is what actually
// enforces a hard limit.
const RESEND_COOLDOWN_SECONDS = 20;

export default function ResetPassword({ email, status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: email ?? '',
        code: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onError: () => reset('code', 'password', 'password_confirmation'),
        });
    };

    const resend = () =>
        new Promise((resolve, reject) => {
            router.post(
                route('password.email'),
                { email: data.email },
                {
                    preserveScroll: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                },
            );
        });

    return (
        <GuestLayout
            icon={LockIcon}
            eyebrow="Password reset"
            title="Enter your code"
            subtitle={
                <>
                    We sent a 6-digit code to{' '}
                    {data.email && <span className="font-medium text-gray-700 dark:text-gray-300">{data.email}</span>}. Enter it
                    below along with your new password.
                </>
            }
            align="center"
        >
            <Head title="Reset Password" />

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
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <OtpInput length={6} value={data.code} onChange={(code) => setData('code', code)} error={errors.code} disabled={processing} />

                <AuthField
                    id="password"
                    label="New Password"
                    type="password"
                    name="password"
                    icon={LockIcon}
                    value={data.password}
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <PasswordStrengthMeter password={data.password} className="-mt-2" />

                <AuthField
                    id="password_confirmation"
                    label="Confirm New Password"
                    type="password"
                    name="password_confirmation"
                    icon={LockIcon}
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                />

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing || data.code.length !== 6}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Resetting...' : 'Reset Password'}
                </PrimaryButton>

                <div className="flex flex-col items-center gap-4 pt-1 sm:flex-row-reverse sm:items-start sm:justify-between">
                    <ResendCodeButton onResend={resend} cooldownSeconds={RESEND_COOLDOWN_SECONDS} />

                    <Link
                        href={route('password.request')}
                        className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ← Use a different email
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
