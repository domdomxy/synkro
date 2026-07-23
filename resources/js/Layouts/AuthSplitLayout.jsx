import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const HIGHLIGHTS = [
    {
        title: 'Role-based collaboration',
        description: 'Owners, managers, members, and testers — each scoped per project.',
        icon: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H2z" />,
    },
    {
        title: 'Full task lifecycle',
        description: 'Todo → in progress → review → done, with a tester approval gate.',
        icon: <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />,
    },
    {
        title: 'Live notifications',
        description: 'Assignments and review decisions arrive the moment they happen.',
        icon: <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
];

function RadarRings() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute left-10 top-8 -z-0">
            {[0, 1.1, 2.2].map((delay) => (
                <div
                    key={delay}
                    className="synkro-radar-ring absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/25"
                    style={{ animationDelay: `${delay}s` }}
                />
            ))}
        </div>
    );
}

/**
 * Split-panel shell for the two primary conversion moments (sign in / sign
 * up): a dark brand panel that stays visually constant regardless of the
 * app's light/dark/black theme (a common pattern for auth screens), paired
 * with the form on a panel that follows the app's normal theme.
 */
export default function AuthSplitLayout({ eyebrow, title, subtitle, children }) {
    return (
        <div className="flex min-h-screen bg-white dark:bg-gray-800">
            <style>{`
                @keyframes synkro-radar-pulse {
                    0% { transform: translate(-50%, -50%) scale(0.55); opacity: 0.55; }
                    100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
                }
                .synkro-radar-ring {
                    animation: synkro-radar-pulse 3.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .synkro-radar-ring { animation: none; opacity: 0.12; transform: translate(-50%, -50%); }
                }
            `}</style>

            {/* Brand panel — hidden below lg, always dark regardless of theme */}
            <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gray-900 px-10 py-12 text-white lg:flex">
                <RadarRings />

                <Link href="/" className="relative z-10 flex items-center gap-2">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-400" />
                    <span className="text-xl font-bold">Synkro</span>
                </Link>

                <div className="relative z-10">
                    <p style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                        Project management
                    </p>
                    <h2 className="mt-2 max-w-xs text-2xl font-semibold leading-snug">
                        Ship work as a team, without losing track of who owns what.
                    </h2>
                </div>

                <ul className="relative z-10 space-y-5">
                    {HIGHLIGHTS.map((h) => (
                        <li key={h.title} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-400">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                    {h.icon}
                                </svg>
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-white">{h.title}</p>
                                <p className="mt-0.5 text-sm text-gray-400">{h.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Form panel */}
            <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
                <Link href="/" className="mb-8 flex items-center gap-2 text-gray-900 lg:hidden dark:text-gray-100">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span className="text-lg font-bold">Synkro</span>
                </Link>

                <div className="w-full max-w-sm">
                    {eyebrow && (
                        <p style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">
                            {eyebrow}
                        </p>
                    )}
                    {title && <h1 className="mt-1.5 text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>}
                    {subtitle && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
