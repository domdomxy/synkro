// Trusted hosts live on the account (server-side), not the browser - see
// the note in ExternalLinkGuard for why. This module keeps the same
// load/subscribe shape it had when it was a localStorage wrapper, so
// callers barely changed, but every read/write now goes through the
// per-account API (routes/web.php -> TrustedHostController) and the list
// is cached at module scope so every subscriber in this tab stays in sync.

const CHANGE_EVENT = 'synkro:trusted-hosts-changed';

let cache = [];
let loaded = false;

function getCsrfToken() {
    return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
}

async function api(url, method) {
    const res = await fetch(url, {
        method,
        headers: {
            'X-XSRF-TOKEN': getCsrfToken(),
            Accept: 'application/json',
        },
    });
    if (!res.ok) throw new Error(`trusted-hosts ${method} ${url} failed`);
    return res.json();
}

function broadcast(hosts) {
    cache = Array.isArray(hosts) ? hosts : [];
    loaded = true;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: cache }));
}

/**
 * Seeds the cache from data the server already sent with the current page
 * (the Settings page gets `trustedLinkHosts` as an Inertia prop), so that
 * page doesn't need a redundant round trip just to show what it was just told.
 */
export function primeTrustedHosts(hosts) {
    if (!loaded) broadcast(hosts);
}

/**
 * Synchronously returns whatever's cached (empty until the first load
 * resolves - same "ask again just this once" behavior as the old
 * localStorage-unavailable fallback) and, on first call, kicks off a fetch
 * to fill it in. Callers should also `subscribeTrustedHosts` to pick up
 * that async result.
 */
export function loadTrustedHosts() {
    if (!loaded) {
        api('/trusted-hosts', 'GET')
            .then((data) => broadcast(data.hosts))
            .catch(() => broadcast([]));
    }
    return cache;
}

/** Marks a host trusted for the current account. Best-effort: if the
 * request fails, the host simply isn't trusted and the dialog asks again
 * next time, same as it always did when it couldn't persist. */
export async function trustHost(host) {
    try {
        const data = await api(`/trusted-hosts/${encodeURIComponent(host)}`, 'PUT');
        broadcast(data.hosts);
    } catch {
        // best effort only, see above
    }
}

export async function revokeTrustedHost(host) {
    const data = await api(`/trusted-hosts/${encodeURIComponent(host)}`, 'DELETE');
    broadcast(data.hosts);
}

export async function revokeAllTrustedHosts() {
    const data = await api('/trusted-hosts', 'DELETE');
    broadcast(data.hosts);
}

/**
 * Subscribes to trusted-hosts changes made anywhere in the app (this tab only).
 * Returns an unsubscribe function.
 */
export function subscribeTrustedHosts(callback) {
    const handler = (event) => callback(event.detail ?? cache);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
}
