

// Additional functions for black theme support

const STORAGE_KEY = 'synkro-theme';

export function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
}

export function setStoredTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
}

// Favicon file to use for each resolved theme. Both "dark" and "black" read
// the same on a dark browser tab, so they share the dark icon.
const FAVICON_BY_THEME = {
    light: '/favicon-light.svg',
    dark: '/favicon-dark.svg',
    black: '/favicon-dark.svg',
};

// Tracks what's currently on screen so the unread badge (see
// setFaviconBadgeCount below) can be redrawn on top of whichever base icon
// is correct right now, without the two concerns needing to know about each
// other's call sites.
let currentResolvedTheme = 'light';
let currentBadgeCount = 0;

function applyFaviconHref(href) {
    document.querySelectorAll('link[rel="icon"][data-theme-favicon]').forEach((link) => {
        if (link.getAttribute('href') !== href) {
            link.setAttribute('href', href);
        }
    });
}

// Draws a small red unread-count badge (like Gmail/Slack's tab icon) over
// the top-right corner of the base favicon and swaps it in. Falls back to
// the plain base icon if the count is cleared or the drawing fails for any
// reason (e.g. canvas unsupported).
function renderFaviconBadge(baseHref, count) {
    const img = new Image();
    img.onload = () => {
        try {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            const radius = size * 0.32;
            const cx = size - radius - 2;
            const cy = radius + 2;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(radius * 1.15)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count > 9 ? '9+' : String(count), cx, cy + 1);

            applyFaviconHref(canvas.toDataURL('image/png'));
        } catch {
            applyFaviconHref(baseHref);
        }
    };
    img.onerror = () => applyFaviconHref(baseHref);
    img.src = baseHref;
}

function renderFavicon() {
    const baseHref = FAVICON_BY_THEME[currentResolvedTheme] || FAVICON_BY_THEME.light;
    if (currentBadgeCount > 0) {
        renderFaviconBadge(baseHref, currentBadgeCount);
    } else {
        applyFaviconHref(baseHref);
    }
}

// Swap the tab favicon to match the resolved theme, the same way GitHub swaps
// its favicon to match the theme picked in its own settings rather than only
// the OS/browser color scheme. This runs on every theme change so the icon
// never falls out of sync with what's on screen.
export function updateFavicon(resolved) {
    currentResolvedTheme = resolved;
    renderFavicon();
}

// Called by NotificationBell whenever the unread count changes so the tab
// icon carries a live badge (mirrors the bell's own red counter) without
// having to know or care which theme is currently resolved.
export function setFaviconBadgeCount(count) {
    currentBadgeCount = count;
    renderFavicon();
}

export function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-black');

    let resolved = theme;
    if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (resolved === 'dark' || resolved === 'black') {
        root.classList.add('dark');
    }
    if (resolved === 'black') {
        root.classList.add('theme-black');
    }

    updateFavicon(resolved);
}

export function watchSystemTheme(callback) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
        if (getStoredTheme() === 'system') applyTheme('system');
        callback?.();
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
}