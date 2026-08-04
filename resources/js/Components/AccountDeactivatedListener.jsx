import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

// Mirrors AccountDeletedListener - deactivating (Account > Deactivate)
// previously only logged out the session that made the request; any other
// open tab/device stayed fully signed in with no way to notice. See
// AccountController::deactivate() and the AccountDeactivated event.
export default function AccountDeactivatedListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.account.deactivated', () => {
        router.post(route('logout'));
    });

    return null;
}
