import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import AuthField from '@/Components/Auth/AuthField';
import EmailValidityHint from '@/Components/EmailValidityHint';
import { MailIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            icon={MailIcon}
            eyebrow="Password reset"
            title="Forgot your password?"
            subtitle="Enter your email address and we'll send you a 6-digit code to choose a new password."
            align="center"
        >
            <Head title="Forgot Password" />

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
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    hint={<EmailValidityHint value={data.email} onChange={(value) => setData('email', value)} />}
                />

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Sending code...' : 'Email Password Reset Code'}
                </PrimaryButton>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                <Link href={route('login')} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    ← Back to login
                </Link>
            </p>
        </GuestLayout>
    );
}
