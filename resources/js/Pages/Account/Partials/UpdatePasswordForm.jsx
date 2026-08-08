import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import PasswordInput from '@/Components/PasswordInput';
import PasswordStrengthMeter from '@/Components/PasswordStrengthMeter';
import PasswordMatchHint from '@/Components/PasswordMatchHint';
import SavedIndicator from '@/Components/SavedIndicator';
import Spinner from '@/Components/Spinner';
import { meetsMinimumStrength } from '@/utils/passwordStrength';
import { silentSubmit } from '@/utils/silentSubmit';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        setError,
        clearErrors,
        reset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const successTimeout = useRef(null);
    const hasChanges = !!(data.current_password || data.password || data.password_confirmation);

    const updatePassword = async (e) => {
        e.preventDefault();

        if (!meetsMinimumStrength(data.password)) {
            setError('password', 'Password strength must be at least "Good" before you can continue.');
            passwordInput.current.focus();
            return;
        }
        clearErrors('password');

        setProcessing(true);

        const result = await silentSubmit(route('password.update'), { method: 'PUT', data });

        if (result.ok) {
            reset();
            setRecentlySuccessful(true);
            clearTimeout(successTimeout.current);
            successTimeout.current = setTimeout(() => setRecentlySuccessful(false), 2000);
        } else if (result.errors) {
            Object.entries(result.errors).forEach(([key, message]) => setError(key, message));

            if (result.errors.password) {
                reset('password', 'password_confirmation');
                passwordInput.current.focus();
            }

            if (result.errors.current_password) {
                reset('current_password');
                currentPasswordInput.current.focus();
            }
        }

        setProcessing(false);
    };

    return (
        <section className={className}>
            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />

                    <PasswordInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        className="mt-1 w-full"
                        autoComplete="current-password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        Use 12+ characters with a mix of letters, numbers, and symbols to reach "Good" strength.
                    </p>

                    <PasswordInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="mt-1 w-full"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />

                    <PasswordStrengthMeter password={data.password} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />

                    <PasswordInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        className="mt-1 w-full"
                        autoComplete="new-password"
                    />

                    <PasswordMatchHint password={data.password} confirmation={data.password_confirmation} />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing || !hasChanges}>
                        {processing && <Spinner className="mr-2 h-4 w-4" />}
                        {processing ? 'Saving…' : 'Save'}
                    </PrimaryButton>

                    <SavedIndicator show={recentlySuccessful} />
                </div>
            </form>
        </section>
    );
}
