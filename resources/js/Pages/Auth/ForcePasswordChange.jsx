import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import PasswordStrengthMeter from '@/Components/PasswordStrengthMeter';
import AuthField from '@/Components/Auth/AuthField';
import { LockIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function ForcePasswordChange() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                }
                if (errors.current_password) {
                    reset('current_password');
                }
            },
        });
    };

    const skip = () => router.visit(route('dashboard'));

    return (
        <GuestLayout
            icon={LockIcon}
            eyebrow="Account security"
            title="Set a new password"
            subtitle="You signed in with a temporary password. We recommend setting a new one now, though you can do this later from Account settings instead."
            align="center"
        >
            <Head title="Set a New Password" />

            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    id="current_password"
                    label="Temporary password"
                    type="password"
                    name="current_password"
                    icon={LockIcon}
                    value={data.current_password}
                    autoComplete="current-password"
                    isFocused={true}
                    onChange={(e) => setData('current_password', e.target.value)}
                    error={errors.current_password}
                />

                <div>
                    <AuthField
                        id="password"
                        label="New password"
                        type="password"
                        name="password"
                        icon={LockIcon}
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />
                    <PasswordStrengthMeter password={data.password} />
                </div>

                <AuthField
                    id="password_confirmation"
                    label="Confirm new password"
                    type="password"
                    name="password_confirmation"
                    icon={LockIcon}
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                />

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Updating...' : 'Update Password'}
                </PrimaryButton>

                <button
                    type="button"
                    onClick={skip}
                    className="w-full rounded-md py-1 text-center text-sm text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                >
                    Do it later
                </button>
            </form>
        </GuestLayout>
    );
}
