import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import SavedIndicator from '@/Components/SavedIndicator';
import EmailValidityHint from '@/Components/EmailValidityHint';
import { isValidEmail } from '@/utils/email';
import { silentSubmit } from '@/utils/silentSubmit';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdateAccountInformation({
    mustVerifyEmail,
    status,
    nameChangeAvailableAt,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, errors, setError, clearErrors } =
        useForm({
            name: user.name,
            email: user.email,
        });
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const successTimeout = useRef(null);
    const hasChanges = data.name !== user.name || data.email !== user.email;

    // Users can only change their display name once every few days (see
    // AccountUpdateRequest) so it doesn't read as a different person to
    // project owners/managers who just got used to the old one.
    const nameChangeLockedUntil = nameChangeAvailableAt ? new Date(nameChangeAvailableAt) : null;
    const nameChangeLocked = nameChangeLockedUntil !== null && nameChangeLockedUntil > new Date();

    const submit = async (e) => {
        e.preventDefault();

        if (!isValidEmail(data.email)) {
            setError('email', 'Please enter a valid email address.');
            return;
        }

        setProcessing(true);
        clearErrors();

        const result = await silentSubmit(route('account.update'), { method: 'PATCH', data });

        if (result.ok) {
            // Header/avatar name and email-verified badge read from the shared
            // auth.user prop, so refresh just that instead of the whole page.
            router.reload({ only: ['auth'], preserveScroll: true, preserveState: true });
            setRecentlySuccessful(true);
            clearTimeout(successTimeout.current);
            successTimeout.current = setTimeout(() => setRecentlySuccessful(false), 2000);
        } else if (result.errors) {
            Object.entries(result.errors).forEach(([key, message]) => setError(key, message));
        }

        setProcessing(false);
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                        disabled={nameChangeLocked}
                        title={nameChangeLocked ? `You can change your name again on ${nameChangeLockedUntil.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.` : undefined}
                    />

                    {nameChangeLocked ? (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            You can change your name again on{' '}
                            {nameChangeLockedUntil.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.
                            Project owners and managers you work with are notified whenever your name changes.
                        </p>
                    ) : (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            You can change your name once every 7 days. Project owners and managers you work with will be notified when it changes.
                        </p>
                    )}

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <InputLabel htmlFor="email" value="Email" />
                        {user.email_verified_at && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Verified
                            </span>
                        )}
                    </div>

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <EmailValidityHint value={data.email} onChange={(value) => setData('email', value)} />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing || !hasChanges}>{processing ? 'Saving…' : 'Save'}</PrimaryButton>

                    <SavedIndicator show={recentlySuccessful} />
                </div>
            </form>
        </section>
    );
}
