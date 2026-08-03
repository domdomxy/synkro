import '../css/app.css';
import { configureEcho, echo, echoIsConfigured } from '@laravel/echo-react';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { watchSystemTheme } from './theme';
import '../css/dark-theme.css';
import '../css/black-theme.css';
import ExternalLinkGuard from './Components/ExternalLinkGuard';

watchSystemTheme();

/**
 * Let the backend know the device's local timezone so any server-rendered,
 * user-facing timestamps (e.g. "you can try again at ...") reflect the
 * viewer's actual local time instead of the server's fixed timezone. This
 * never affects how timestamps are stored — only how a few flash messages
 * are formatted before being sent back to this same device.
 */
function syncDeviceTimezone() {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!timezone) return;

        const existing = document.cookie
            .split('; ')
            .find((row) => row.startsWith('device_timezone='))
            ?.split('=')[1];

        if (existing !== timezone) {
            document.cookie = `device_timezone=${timezone}; path=/; max-age=31536000; SameSite=Lax`;
        }
    } catch {
        // Intl unsupported or blocked — server just falls back to its own timezone.
    }
}

syncDeviceTimezone();

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

configureEcho({
    broadcaster: 'reverb',
});

/**
 * Backend broadcasts (task changed, comment posted, roster updated, etc.)
 * are almost all sent with ->toOthers() so the person who triggered the
 * change doesn't also get pushed a live update about their own action.
 * ->toOthers() can only exclude the sender if the request that triggered
 * the broadcast carries that browser tab's own Echo socket ID as the
 * X-Socket-Id header (see Laravel's broadcasting docs). Inertia's request
 * client isn't Echo-aware by default, so without this every "toOthers"
 * broadcast was reaching the sender's own tab too - e.g. creating,
 * updating, or deleting a task would broadcast .task.changed back to the
 * same tab, which triggers Show.jsx's own listener to router.reload() the
 * page. That reload is a brand new Inertia visit, and since Inertia only
 * tracks one in-flight visit at a time, it could cancel the original
 * create/update/delete visit before its flash-message response was ever
 * applied - which is why the success toast would silently not show up
 * even though the task action itself worked.
 */
router.on('before', (event) => {
    if (!echoIsConfigured()) return;

    const socketId = echo().socketId();
    if (socketId) {
        event.detail.visit.headers['X-Socket-Id'] = socketId;
    }
});

createInertiaApp({
    title: (title) => title || appName,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ExternalLinkGuard>
                <App {...props} />
            </ExternalLinkGuard>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
