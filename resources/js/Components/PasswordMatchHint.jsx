/**
 * Live "do these two passwords match" hint, shown under a confirm-password
 * field as the person types - green check once the confirmation matches the
 * primary password, red warning if it's non-empty but doesn't match yet.
 * Stays silent until the person has actually typed something into the
 * confirmation field, so it doesn't nag before there's anything to compare.
 */
export default function PasswordMatchHint({ password, confirmation, className = '' }) {
    if (!confirmation) return null;

    const matches = password === confirmation;

    return matches ? (
        <p className={'mt-1.5 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 ' + className}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Passwords match
        </p>
    ) : (
        <p className={'mt-1.5 inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 ' + className}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Passwords don't match
        </p>
    );
}
