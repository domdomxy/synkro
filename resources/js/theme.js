

// Additional functions for black theme support

const STORAGE_KEY = 'synkro-theme';

export function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'system';
}

export function setStoredTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
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