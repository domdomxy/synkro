import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

export default function SuspensionListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.suspended', () => {
        router.post(route('suspended-logout'));
    });

    return null;
}