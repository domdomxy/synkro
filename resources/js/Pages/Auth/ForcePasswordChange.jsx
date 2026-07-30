import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import PasswordStrengthMeter from '@/Components/PasswordStrengthMeter';
import { meetsMinimumStrength } from '@/utils/passwordStrength';
import AuthField from '@/Components/Auth/AuthField';
import { LockIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForcePasswordChange() {
    const { data, setData, put, processing, errors, setError, clearErrors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        if (!meetsMinimumStrength(data.password)) {
            setError('password', 'Password strength must be at least "Good" before you can continue.');
            return;
        }
        clearErrors('password');

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

    return (
        <GuestLayout
            icon={LockIcon}
            eyebrow="Account security"
            title="Set a new password"
            subtitle="You signed in with a temporary password. Set a new one below to continue to your account."
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
            </form>
        </GuestLayout>
    );
}
