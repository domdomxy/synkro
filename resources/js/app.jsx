import '../css/app.css';
import { configureEcho } from '@laravel/echo-react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { watchSystemTheme } from './theme';
import '../css/black-theme.css';

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

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
