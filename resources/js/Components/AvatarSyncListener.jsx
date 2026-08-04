import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

// The navbar/account-menu avatar comes from the `auth.user` prop shared on
// every page (see HandleInertiaRequests). A change made on another open
// tab/device doesn't touch this tab's copy of that prop, so a targeted
// reload of just `auth` is enough to pick up the new avatar_path without a
// full page refresh. See AccountController::updateAvatar()/destroyAvatar()
// and the AvatarUpdated event.
export default function AvatarSyncListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.account.avatar-updated', () => {
        router.reload({ only: ['auth'] });
    });

    return null;
}
