// Deliberately simple: this is a UX-layer sanity check to catch obvious typos
// (missing "@", no domain, stray spaces) the instant someone types them,
// not a replacement for Laravel's own 'email' validation rule server-side -
// that one remains the authoritative check (it also verifies uniqueness,
// which this obviously can't).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The handful of providers people type into this app most often, and so the
// ones worth catching a near-miss on (transposed/missing/extra letter -
// "gamil.com", "gimal.com", "gmial.com", "yahooo.com", etc.). A typo'd
// domain like this still satisfies EMAIL_PATTERN above (it has an "@" and a
// dot), so the person would otherwise only find out it's wrong once the
// verification email never arrives.
const POPULAR_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'proton.me',
];

function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
    }

    return dp[m][n];
}

/**
 * If the domain half of `value` is a near-miss (edit distance 1-2, and not
 * itself already a popular domain or something wildly different) of a
 * well-known provider, returns the corrected full address to suggest -
 * otherwise null. Distance threshold scales down for short domains so e.g.
 * "aol.com" typos don't over-match unrelated short domains.
 */
export function suggestEmailCorrection(value) {
    const trimmed = (value ?? '').trim().toLowerCase();
    const at = trimmed.lastIndexOf('@');
    if (at === -1 || at === trimmed.length - 1) return null;

    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    if (!domain) return null;
    if (POPULAR_DOMAINS.includes(domain)) return null;

    let best = null;
    let bestDistance = Infinity;

    for (const candidate of POPULAR_DOMAINS) {
        const distance = levenshtein(domain, candidate);
        const threshold = candidate.length <= 7 ? 1 : 2;
        if (distance > 0 && distance <= threshold && distance < bestDistance) {
            best = candidate;
            bestDistance = distance;
        }
    }

    return best ? `${local}@${best}` : null;
}

/**
 * True once `value` looks like a plausible email address. Empty strings are
 * treated as "not yet invalid" (hasInput below is what callers should use to
 * decide whether to actually render an error).
 */
export function isValidEmail(value) {
    return EMAIL_PATTERN.test((value ?? '').trim());
}

/**
 * Convenience wrapper for live inline feedback under an email field: whether
 * there's been any input at all, whether that input currently looks valid,
 * and a likely-typo domain correction to suggest if there is one. Meant to
 * back a red "enter a valid email" message, a green checkmark once the
 * address is well-formed, or an amber "did you mean…" nudge - see
 * EmailValidityHint.
 */
export function emailValidity(value) {
    const trimmed = (value ?? '').trim();
    const hasInput = trimmed.length > 0;
    const isValid = hasInput && isValidEmail(trimmed);
    const suggestion = isValid ? suggestEmailCorrection(trimmed) : null;
    return { hasInput, isValid, suggestion };
}
