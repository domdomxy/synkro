import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import PasswordInput from '@/Components/PasswordInput';
import PasswordStrengthMeter from '@/Components/PasswordStrengthMeter';
import SavedIndicator from '@/Components/SavedIndicator';
import { meetsMinimumStrength } from '@/utils/passwordStrength';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        setError,
        clearErrors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        if (!meetsMinimumStrength(data.password)) {
            setError('password', 'Password strength must be at least "Good" before you can continue.');
            passwordInput.current.focus();
            return;
        }
        clearErrors('password');

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
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

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save'}</PrimaryButton>

                    <SavedIndicator show={recentlySuccessful} />
                </div>
            </form>
        </section>
    );
}
