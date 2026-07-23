import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import AuthField from '@/Components/Auth/AuthField';
import { LockIcon } from '@/Components/Auth/icons';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout
            icon={LockIcon}
            eyebrow="Secure area"
            title="Confirm your password"
            subtitle="This is a secure area of the application. Please confirm your password before continuing."
            align="center"
        >
            <Head title="Confirm Password" />

            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    name="password"
                    icon={LockIcon}
                    value={data.password}
                    isFocused={true}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Confirming...' : 'Confirm'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
