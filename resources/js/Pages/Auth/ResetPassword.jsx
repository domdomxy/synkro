import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import AuthField from '@/Components/Auth/AuthField';
import { MailIcon, LockIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout
            icon={LockIcon}
            eyebrow="Password reset"
            title="Choose a new password"
            subtitle="Make it something you haven't used before on Synkro."
            align="center"
        >
            <Head title="Reset Password" />

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

                <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    name="password"
                    icon={LockIcon}
                    value={data.password}
                    autoComplete="new-password"
                    isFocused={true}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <AuthField
                    id="password_confirmation"
                    label="Confirm Password"
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
                    {processing ? 'Resetting...' : 'Reset Password'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
