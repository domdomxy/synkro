import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

export default function AccountDeletedListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.account.deleted', () => {
        // The account row is already gone by the time this fires, so this
        // session can no longer resolve a user either; logging out just
        // clears the now-stale local session and lands on the login page.
        router.post(route('logout'));
    });

    return null;
}
