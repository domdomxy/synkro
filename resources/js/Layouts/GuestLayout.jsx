import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const ICON_TONES = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    red: 'bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
};

// Kept subtle and opt-in: only pages that ask for a `glow` render it, so the
// rest of the guest pages stay exactly as they were.
const GLOW_TONES = {
    indigo: 'bg-indigo-400/10 dark:bg-indigo-500/10',
    red: 'bg-red-400/10 dark:bg-red-500/10',
};

/**
 * Focused single-column shell for the auth "utility" flows (forgot/reset
 * password, confirm password, verify email, appeal). Used for anything
 * that isn't a primary sign-in/sign-up moment, where a distraction-free
 * single card gets the person through the task fastest.
 */
export default function GuestLayout({
    icon: Icon,
    iconTone = 'indigo',
    eyebrow,
    title,
    subtitle,
    align = 'left',
    glow,
    children,
}) {
    const centered = align === 'center';

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-10 dark:bg-gray-900">
            {glow && (
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl ${GLOW_TONES[glow] ?? GLOW_TONES.indigo}`}
                />
            )}
            <Link href="/" className="relative mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg font-bold">Synkro</span>
            </Link>

            <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 sm:max-w-md dark:bg-gray-800 dark:ring-gray-700">
                <div className="px-6 py-8 sm:px-8">
                    {(Icon || eyebrow || title || subtitle) && (
                        <div className={`mb-6 ${centered ? 'flex flex-col items-center text-center' : ''}`}>
                            {Icon && (
                                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${ICON_TONES[iconTone]}`}>
                                    <Icon className="h-7 w-7" />
                                </div>
                            )}
                            {eyebrow && (
                                <p
                                    style={MONO}
                                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400"
                                >
                                    {eyebrow}
                                </p>
                            )}
                            {title && (
                                <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}
