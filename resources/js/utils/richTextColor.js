// Utilities for keeping RichTextEditor's inline text colors readable across the app's light/dark/
// black themes.
//
// The editor lets people pick any text color via execCommand('foreColor', ...), which (with
// styleWithCSS forced on - see RichTextEditor.jsx) gets saved as a literal `style="color:#hex"` on
// the stored HTML. That's fine while editing in whichever theme happens to be active, but the same
// stored HTML is later rendered wherever that description/comment shows up - including after the
// person switches themes, or for anyone else viewing it in a different theme. A near-black color
// picked in light mode becomes unreadable against the dark editor/page background, and a near-white
// color picked in dark mode disappears against a light background.
//
// Rather than baking one color into storage, colors are adjusted at render time based on whichever
// theme is actually active right now, so the same stored HTML stays legible everywhere it's shown.

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function hexToRgb(hex) {
    const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r: h = ((g - b) / d) % 6; break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

// WCAG relative luminance / contrast ratio.
function relativeLuminance({ r, g, b }) {
    const chan = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrastRatio(rgbA, rgbB) {
    const l1 = relativeLuminance(rgbA);
    const l2 = relativeLuminance(rgbB);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
}

// Approximate effective page background for each theme (white in light mode; gray-900, the darkest
// background used throughout the app, in dark/black mode). Doesn't need to be exact - it just needs
// to be dark/light enough to catch genuinely unreadable text.
const BACKGROUNDS = {
    light: { r: 255, g: 255, b: 255 },
    dark: { r: 17, g: 24, b: 39 }, // gray-900
};

const MIN_CONTRAST = 2.3; // lenient on purpose - only rescues colors that are genuinely unreadable
const SAFE_LIGHT_FALLBACK = '#111827'; // gray-900, for a light background
const SAFE_DARK_FALLBACK = '#f3f4f6'; // gray-100, for a dark background

/**
 * Given a hex color as picked in the editor, returns the color that should actually render right
 * now for the given theme. Colors with acceptable contrast pass through unchanged. Colors too close
 * to the current background have their lightness flipped (hue/saturation kept) so e.g. near-black
 * text picked for light mode becomes near-white in dark mode, and vice versa - while a mid-tone
 * color like a blue or green is left alone since it already reads fine on both.
 */
export function readableRichTextColor(hex, isDark) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const bg = isDark ? BACKGROUNDS.dark : BACKGROUNDS.light;
    if (contrastRatio(rgb, bg) >= MIN_CONTRAST) return hex;

    const hsl = rgbToHsl(rgb);
    const flipped = hslToRgb({
        h: hsl.h,
        s: hsl.s,
        l: isDark ? Math.max(100 - hsl.l, 82) : Math.min(100 - hsl.l, 22),
    });

    if (contrastRatio(flipped, bg) >= MIN_CONTRAST) return rgbToHex(flipped);
    return isDark ? SAFE_DARK_FALLBACK : SAFE_LIGHT_FALLBACK;
}

// Matches an inline `color: #xyz` (3- or 6-digit hex) declaration inside a style attribute, capturing
// the hex value. Rich text only ever stores hex colors here (see TEXT_COLORS/customColor in
// RichTextEditor.jsx, and the native <input type="color"> used for custom picks) - execCommand with
// styleWithCSS enabled never emits rgb()/named colors for foreColor in the browsers this app
// supports - so a hex-only regex is sufficient without needing to parse the HTML into a DOM.
const INLINE_COLOR_PATTERN = /color\s*:\s*(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))\s*;?/g;

/**
 * Rewrites every inline `color:` declaration in a rich-text HTML string so it stays readable against
 * the currently active theme's background. Plain string transform (no DOM parsing/reserialization),
 * so it's cheap to call on every render and a no-op for HTML with no colored spans.
 */
export function adjustRichTextColors(html, isDark) {
    if (!html) return html;
    return html.replace(INLINE_COLOR_PATTERN, (match, hex) => `color: ${readableRichTextColor(hex, isDark)};`);
}
