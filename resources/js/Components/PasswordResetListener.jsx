import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

export default function PasswordResetListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.password.reset', () => {
        router.post(route('password-reset-logout'));
    });

    return null;
}
