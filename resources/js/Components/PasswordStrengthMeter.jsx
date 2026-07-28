import { scorePassword, getSuggestions, MIN_ACCEPTABLE_SCORE } from '@/utils/passwordStrength';

export default function PasswordStrengthMeter({ password, className = '' }) {
    const { score, hasInput, label, barColor, textColor } = scorePassword(password);

    if (!hasInput) return null;

    const filled = Math.max(1, score);
    const belowMinimum = score < MIN_ACCEPTABLE_SCORE;
    const suggestions = belowMinimum ? getSuggestions(password) : [];

    return (
        <div className={`mt-2 ${className}`} aria-live="polite">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < filled ? barColor : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                ))}
            </div>
            <p className={`mt-1 text-xs font-medium ${textColor}`}>{label}</p>
            {belowMinimum && suggestions.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {suggestions.map((tip) => (
                        <li key={tip}>{tip}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
