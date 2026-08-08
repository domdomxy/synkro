import { scorePassword, getSuggestions, MIN_ACCEPTABLE_SCORE } from '@/utils/passwordStrength';

// Criteria pills shown under the "Password Strength" header - each one lights
// up the moment the password satisfies it, giving an at-a-glance checklist
// alongside the overall score/label above.
const CRITERIA = [
    { key: 'length', label: '8 Chars', test: (p) => p.length >= 8 },
    { key: 'upper', label: 'A-Z', test: (p) => /[A-Z]/.test(p) },
    { key: 'lower', label: 'a-z', test: (p) => /[a-z]/.test(p) },
    { key: 'digit', label: '123', test: (p) => /[0-9]/.test(p) },
    { key: 'symbol', label: '@#$', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

// Dot/text color for a met criterion, keyed to the same scale used for the
// overall label so the checklist and the headline strength word stay in sync.
const DOT_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-500'];

export default function PasswordStrengthMeter({ password, className = '' }) {
    const { score, hasInput, label, textColor } = scorePassword(password);

    if (!hasInput) return null;

    const belowMinimum = score < MIN_ACCEPTABLE_SCORE;
    const suggestions = belowMinimum ? getSuggestions(password) : [];
    const dotColor = DOT_COLORS[score];

    return (
        <div className={`mt-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-900/40 ${className}`} aria-live="polite">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password Strength</p>
                <p className={`text-xs font-bold ${textColor}`}>{label}</p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {CRITERIA.map(({ key, label: criterionLabel, test }) => {
                    const met = test(password);
                    return (
                        <span key={key} className="inline-flex items-center gap-1">
                            <span
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${met ? dotColor : 'bg-gray-300 dark:bg-gray-600'}`}
                            />
                            <span
                                className={`text-[11px] transition-colors ${
                                    met ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                {criterionLabel}
                            </span>
                        </span>
                    );
                })}
            </div>

            {belowMinimum && suggestions.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 border-t border-gray-200 pl-4 pt-2 text-xs font-normal text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {suggestions.map((tip) => (
                        <li key={tip}>{tip}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
