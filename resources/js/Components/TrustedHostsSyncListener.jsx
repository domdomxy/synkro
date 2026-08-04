import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { applyRemoteTrustedHosts } from '@/utils/trustedHosts';

// Trusted Sites already has a same-tab pub/sub (utils/trustedHosts.js)
// shared between the Settings panel and ExternalLinkGuard. This extends
// that to other open tabs/devices too, so revoking a host on one browser
// doesn't leave a stale "trusted" entry showing on another until its next
// full reload. See TrustedHostController and TrustedHostsUpdated.
export default function TrustedHostsSyncListener() {
    const { auth } = usePage().props;

    useEcho(`user.${auth.user.id}`, '.settings.trusted-hosts-updated', (payload) => {
        applyRemoteTrustedHosts(payload.hosts ?? []);
    });

    return null;
}
