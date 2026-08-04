import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

// Mirrors AccountDeletedListener/SuspensionListener's live-kick pattern.
// Disconnecting a device (Settings > Logged in devices) only deletes its
// session row server-side - without this, an already-open tab on that
// device stays looking signed in until its next request happens to fail.
// See DeviceSessionController and the DeviceDisconnected event's docblock
// for why exactly one of session_id / except_session_id is set.
export default function DeviceDisconnectedListener() {
    const { auth } = usePage().props;
    const mySessionId = auth.session_id;

    useEcho(`user.${auth.user.id}`, '.settings.device-disconnected', (payload) => {
        const shouldLogout = payload.session_id
            ? payload.session_id === mySessionId
            : payload.except_session_id !== mySessionId;

        if (shouldLogout) {
            router.post(route('logout'));
        }
    });

    return null;
}
