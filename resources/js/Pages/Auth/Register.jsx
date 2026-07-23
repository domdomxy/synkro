import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import AuthField from '@/Components/Auth/AuthField';
import { UserIcon, MailIcon, LockIcon } from '@/Components/Auth/icons';
import AuthSplitLayout from '@/Layouts/AuthSplitLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthSplitLayout
            eyebrow="Get started"
            title="Create your account"
            subtitle="Set up your account to start organizing projects with your team."
        >
            <Head title="Register" />

            <form onSubmit={submit} className="space-y-4">
                <AuthField
                    id="name"
                    label="Name"
                    name="name"
                    icon={UserIcon}
                    value={data.name}
                    autoComplete="name"
                    isFocused={true}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    required
                />

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
                    required
                />

                <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    name="password"
                    icon={LockIcon}
                    value={data.password}
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
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
                    required
                />

                <PrimaryButton className="w-full justify-center py-2.5" disabled={processing}>
                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                    {processing ? 'Creating account...' : 'Register'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Already registered?{' '}
                <Link href={route('login')} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Sign in instead
                </Link>
            </p>
        </AuthSplitLayout>
    );
}
