import { useEffect, useState } from 'react';

// Tracks whether the `dark` class is currently applied to <html> (see resources/js/theme.js -
// applyTheme() toggles it for both the 'dark' and 'black' theme options, so this covers both).
// Needed by components that must know the active theme in JS, not just via Tailwind's `dark:`
// classes - e.g. adjusting rich-text inline colors so stored content stays readable after a theme
// switch. Uses a MutationObserver rather than polling/context since the theme can change at any
// time (Settings page, or the system preference changing while `theme === 'system'`) without this
// component remounting.
export default function useIsDarkMode() {
    const [isDark, setIsDark] = useState(
        () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            setIsDark(root.classList.contains('dark'));
        });
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return isDark;
}
