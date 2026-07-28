// Small set of the most common weak passwords worth calling out explicitly.
// Not meant to be exhaustive (that's what Laravel's own uncompromised-password
// check is for server-side) — just enough to catch the obvious ones instantly
// in the UI as the person types.
const COMMON_PASSWORDS = new Set([
    'password', 'password1', '12345678', '123456789', '1234567890',
    'qwerty123', 'qwertyuiop', 'letmein', 'welcome1', 'iloveyou',
    'admin123', 'football', 'baseball', 'monkey123', 'dragon123',
    'trustno1', 'sunshine', 'princess', 'superman', 'starwars',
]);

function classesPresent(password) {
    return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
}

function hasSequentialRun(password, minRun = 3) {
    const s = password.toLowerCase();
    let ascRun = 1;
    let descRun = 1;

    for (let i = 1; i < s.length; i++) {
        const prev = s.charCodeAt(i - 1);
        const curr = s.charCodeAt(i);
        ascRun = curr === prev + 1 ? ascRun + 1 : 1;
        descRun = curr === prev - 1 ? descRun + 1 : 1;
        if (ascRun >= minRun || descRun >= minRun) return true;
    }

    return false;
}

function hasRepeatedRun(password, minRun = 3) {
    let run = 1;

    for (let i = 1; i < password.length; i++) {
        run = password[i] === password[i - 1] ? run + 1 : 1;
        if (run >= minRun) return true;
    }

    return false;
}

const LEVELS = [
    { label: 'Very Weak', barColor: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
    { label: 'Weak', barColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
    { label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Good', barColor: 'bg-lime-500', textColor: 'text-lime-600 dark:text-lime-400' },
    { label: 'Strong', barColor: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
];

/**
 * Scores a candidate password from 0 (very weak) to 4 (strong).
 * Purely a UX nudge — the actual minimum requirement is still enforced
 * server-side by Laravel's Password::defaults() rule, this never blocks
 * submission on its own.
 */
export function scorePassword(password) {
    if (!password) {
        return { score: 0, hasInput: false, percent: 0, ...LEVELS[0] };
    }

    if (password.length < 8 || COMMON_PASSWORDS.has(password.toLowerCase())) {
        return { score: 0, hasInput: true, percent: 100 / 4, ...LEVELS[0] };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    const classes = classesPresent(password);
    if (classes >= 3) score++;
    if (classes >= 4) score++;

    if (hasSequentialRun(password) || hasRepeatedRun(password)) score--;

    score = Math.max(0, Math.min(4, score));

    return { score, hasInput: true, percent: (Math.max(1, score) / 4) * 100, ...LEVELS[score] };
}
