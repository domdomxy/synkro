

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

// Swap the tab favicon to match the resolved theme, the same way GitHub swaps
// its favicon to match the theme picked in its own settings rather than only
// the OS/browser color scheme. This runs on every theme change so the icon
// never falls out of sync with what's on screen.
export function updateFavicon(resolved) {
    const href = FAVICON_BY_THEME[resolved] || FAVICON_BY_THEME.light;
    document.querySelectorAll('link[rel="icon"][data-theme-favicon]').forEach((link) => {
        if (link.getAttribute('href') !== href) {
            link.setAttribute('href', href);
        }
    });
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