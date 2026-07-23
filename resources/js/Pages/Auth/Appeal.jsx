// resources/js/Pages/Auth/Appeal.jsx

import GuestLayout from '@/Layouts/GuestLayout';
import AuthField from '@/Components/Auth/AuthField';
import { MailIcon } from '@/Components/Auth/icons';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import { Head, Link, useForm } from '@inertiajs/react';

const MESSAGE_MAX = 2000;

export default function Appeal() {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        email: '',
        message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('appeal.store'));
    };

    return (
        <GuestLayout
            glow="indigo"
            eyebrow="Suspended account"
            title="Appeal a Suspension"
            subtitle="If your account was suspended and you believe this was a mistake, tell us why below."
        >
            <Head title="Appeal a Suspension" />

            {recentlySuccessful ? (
                <div className="flex items-start gap-2.5 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Your appeal has been submitted. We'll review it as soon as possible.
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    {errors.limit && (
                        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-red-700 dark:text-red-400">{errors.limit}</p>
                        </div>
                    )}

                    <AuthField
                        id="email"
                        label="Your account email"
                        type="email"
                        icon={MailIcon}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        autoFocus
                    />
                    <div>
                        <div className="flex items-baseline justify-between">
                            <InputLabel htmlFor="message" value="Why do you think this suspension should be lifted?" />
                            <span className="shrink-0 pl-3 text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                                {data.message.length}/{MESSAGE_MAX}
                            </span>
                        </div>
                        <textarea
                            id="message"
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            rows={5}
                            maxLength={MESSAGE_MAX}
                            placeholder="Give us some context..."
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        />
                        <InputError message={errors.message} className="mt-2" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <Link href={route('login')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                            ← Back to login
                        </Link>
                        <PrimaryButton disabled={processing || !!errors.limit || !data.message.trim()}>
                            {processing && <Spinner className="mr-2 h-3.5 w-3.5" />}
                            {processing ? 'Sending...' : 'Submit Appeal'}
                        </PrimaryButton>
                    </div>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                        You can submit one appeal every 6 hours per account.
                    </p>
                </form>
            )}
        </GuestLayout>
    );
}
