// resources/js/Pages/Auth/Appeal.jsx

import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';

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
        <GuestLayout>
            <Head title="Appeal a Suspension" />

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appeal a Suspension</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                If your account was suspended and you believe this was a mistake, tell us why below.
            </p>

            {recentlySuccessful ? (
                <div className="mt-6 flex items-center gap-2 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Your appeal has been submitted. We'll review it as soon as possible.
                </div>
            ) : (
                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="Your account email" />
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 block w-full"
                            autoFocus
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="message" value="Why do you think this suspension should be lifted?" />
                        <textarea
                            id="message"
                            value={data.message}
                            onChange={(e) => setData('message', e.target.value)}
                            rows={5}
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        />
                        <InputError message={errors.message} className="mt-2" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Link href={route('login')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                            ← Back to login
                        </Link>
                        <PrimaryButton disabled={processing}>Submit Appeal</PrimaryButton>
                    </div>
                </form>
            )}
        </GuestLayout>
    );
}