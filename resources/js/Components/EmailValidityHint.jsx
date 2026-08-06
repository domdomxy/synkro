import { emailValidity } from '@/utils/email';

/**
 * Live "does this look like an email address" hint, shown under an email
 * input as the person types - green check once it's well-formed, amber
 * "did you mean…" if it's a likely typo of a well-known domain (gamil.com,
 * gmial.com, etc.), red warning if it isn't a valid address shape at all.
 * Purely a client-side format check (see utils/email); the server's own
 * validation (including uniqueness) still has the final say and reports
 * through the normal InputError below this.
 */
export default function EmailValidityHint({ value, onChange, className = '' }) {
    const { hasInput, isValid, suggestion } = emailValidity(value);

    if (!hasInput) return null;

    if (suggestion) {
        return (
            <p className={'mt-1.5 inline-flex flex-wrap items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ' + className}>
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Did you mean{' '}
                {onChange ? (
                    <button
                        type="button"
                        onClick={() => onChange(suggestion)}
                        className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                        {suggestion}
                    </button>
                ) : (
                    <span className="font-medium">{suggestion}</span>
                )}
                ?
            </p>
        );
    }

    return isValid ? (
        <p className={'mt-1.5 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 ' + className}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Looks like a valid email address
        </p>
    ) : (
        <p className={'mt-1.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 ' + className}>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Enter a valid email address
        </p>
    );
}
