export const TRUSTED_HOSTS_KEY = 'synkro:trusted-link-hosts';

// Fired whenever the trusted-hosts list changes, so every mounted component
// (the ExternalLinkGuard listening globally, the Settings page showing the
// list) stays in sync within the same tab. The native `storage` event only
// fires in *other* tabs/windows, so a custom event covers the same-tab case.
const CHANGE_EVENT = 'synkro:trusted-hosts-changed';

export function loadTrustedHosts() {
    try {
        const raw = window.localStorage.getItem(TRUSTED_HOSTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return []; // localStorage unavailable (private browsing, etc) - just always ask
    }
}

export function saveTrustedHosts(hosts) {
    try {
        window.localStorage.setItem(TRUSTED_HOSTS_KEY, JSON.stringify(hosts));
    } catch {
        // best effort only - if it can't persist, callers just fall back to asking again
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: hosts }));
}

/**
 * Subscribes to trusted-hosts changes made anywhere in the app (this tab only).
 * Returns an unsubscribe function.
 */
export function subscribeTrustedHosts(callback) {
    const handler = (event) => callback(event.detail ?? loadTrustedHosts());
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
}
