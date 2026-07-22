import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { getStoredTheme, setStoredTheme } from '@/theme';

const MONO = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const ACCENTS = {
    indigo: { bar: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-950/40', iconText: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
    teal: { bar: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-50 dark:bg-teal-950/40', iconText: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconText: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    pink: { bar: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', iconBg: 'bg-pink-50 dark:bg-pink-950/40', iconText: 'text-pink-600 dark:text-pink-400', dot: 'bg-pink-500' },
};

const features = [
    {
        title: 'Role-based collaboration',
        description: 'Owners, managers, members, and testers each get exactly the permissions that fit their role, scoped per project rather than globally. Change roles live, transfer ownership, or leave a project at any time.',
        icon: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H2zm15-9a4 4 0 100-8 4 4 0 000 8zm-1.5 1.5c.49-.13 1-.2 1.5-.2a6 6 0 016 6H17a7.97 7.97 0 00-3.5-6.6V12.5z" />,
        accent: 'indigo',
    },
    {
        title: 'Full task lifecycle',
        description: 'Tasks flow from todo → in progress → submitted → in review → done. Attach files or links as deliverables, edit submissions before review begins, and get a full tester approval gate before anything is marked complete.',
        icon: <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />,
        accent: 'teal',
    },
    {
        title: 'Live notifications',
        description: 'Task assignments, review decisions, role changes, member joins and departures: every meaningful event arrives live via WebSocket. A persistent notification center with category and read/unread filters keeps you in control.',
        icon: <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
        accent: 'amber',
    },
    {
        title: 'Activity logs',
        description: 'Every action on a project is logged, including member changes, role updates, task edits, and ownership transfers. Sign-ins get their own dedicated history too, with device, browser, and location on every login plus an instant email alert you can toggle off anytime.',
        icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />,
        accent: 'pink',
    },
    {
        title: 'Personal dashboard',
        description: 'A full activity chart, deadline calendar with week/month/year views, due-soon alerts, task status breakdown, and personal reminders: everything you need to stay organized.',
        icon: <path d="M16 8v8m-4-5v5m-4-2v2M4 20h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v13a1 1 0 001 1z" />,
        accent: 'indigo',
    },
    {
        title: 'Platform admin',
        description: 'A dedicated admin panel for managing users and overseeing platform activity: activate, deactivate, or change global roles, separate from project-level permissions.',
        icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zm0 4.2L7 8.5v3.7c0 3.4 2.3 6.1 5 7.2 2.7-1.1 5-3.8 5-7.2V8.5l-5-2.3z" />,
        accent: 'teal',
    },
];

const THEME_CYCLE = ['system', 'light', 'dark', 'black'];
const THEME_ICONS = {
    system: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L15 17M4 13.5V6a2 2 0 012-2h12a2 2 0 012 2v7.5a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
        </svg>
    ),
    light: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    dark: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
    black: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
};

function ThemeToggleButton() {
    const [theme, setThemeState] = useState(getStoredTheme());
    const cycle = () => {
        const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
        setStoredTheme(next);
        setThemeState(next);
    };
    return (
        <button
            onClick={cycle}
            title={`Theme: ${theme}`}
            className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
            {THEME_ICONS[theme]}
        </button>
    );
}

function useFadeInOnScroll() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, visible];
}

function useCountUp(target, { duration = 1400, delay = 250 } = {}) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        const safeTarget = Number.isFinite(target) ? target : 0;

        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            setValue(safeTarget);
            return;
        }

        let raf;
        let start;
        const timeout = setTimeout(() => {
            const step = (timestamp) => {
                if (start === undefined) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setValue(Math.round(eased * safeTarget));
                if (progress < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, delay);

        return () => {
            clearTimeout(timeout);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [target, duration, delay]);

    return value;
}

function RadarRings({ ringClassName = 'border-indigo-300/40 dark:border-indigo-500/25', size = 'h-72 w-72' }) {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2">
            {[0, 1.1, 2.2].map((delay) => (
                <div
                    key={delay}
                    className={`synkro-radar-ring absolute left-1/2 top-1/2 ${size} -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringClassName}`}
                    style={{ animationDelay: `${delay}s` }}
                />
            ))}
        </div>
    );
}

function StatColumn({ label, value, accent }) {
    const count = useCountUp(value);
    return (
        <div className="flex-1 px-6 py-5 text-center sm:text-left">
            <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
                <span style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    {label}
                </span>
            </div>
            <p style={MONO} className={`mt-1.5 text-3xl font-bold tabular-nums sm:text-4xl ${accent.text}`}>
                {count.toLocaleString()}
            </p>
        </div>
    );
}

function StatStrip({ stats }) {
    return (
        <div className="mx-auto mt-14 flex max-w-2xl flex-col divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white/70 backdrop-blur sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/60">
            <StatColumn label="Users" value={stats.users} accent={ACCENTS.indigo} />
            <StatColumn label="Projects" value={stats.projects} accent={ACCENTS.pink} />
            <StatColumn label="Tasks" value={stats.tasks} accent={ACCENTS.teal} />
        </div>
    );
}

function FeatureCard({ feature, index }) {
    const [ref, visible] = useFadeInOnScroll();
    const accent = ACCENTS[feature.accent];
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${index * 60}ms` }}
            className={`group relative overflow-hidden rounded-lg bg-white p-6 pt-7 ring-1 ring-gray-100 transition-all duration-500 hover:-translate-y-1 hover:ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-gray-600 ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
        >
            <span className={`absolute inset-x-0 top-0 h-1 ${accent.bar} opacity-70 transition-opacity group-hover:opacity-100`} />
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    {feature.icon}
                </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{feature.description}</p>
        </div>
    );
}

export default function Welcome({ auth, stats }) {
    const [heroVisible, setHeroVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const liveStats = stats ?? { users: 0, projects: 0, tasks: 0 };

    return (
        <>
            <Head title="Welcome" />
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xl font-bold">Synkro</span>
                    </div>

                    <nav className="flex items-center gap-3">
                        <ThemeToggleButton />
                        {auth.user ? (
                            <Link href={route('projects.index')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                                Projects
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href={route('login')} className="text-sm font-medium text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                                    Log in
                                </Link>
                                <Link href={route('register')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>
                </header>

                <main>
                    <section className="relative mx-auto max-w-4xl px-6 py-20 text-center">
                        <RadarRings />

                        <div
                            className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 transition-all duration-700 dark:border-gray-700 dark:bg-gray-800 ${
                                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                            }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                            </span>
                            <span style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                                Real numbers, updated live
                            </span>
                        </div>

                        <h1
                            className={`mt-6 text-4xl font-bold tracking-tight text-gray-900 transition-all duration-700 dark:text-gray-100 sm:text-5xl ${
                                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                            }`}
                        >
                            Plan projects. Assign tasks. <span className="text-indigo-600 dark:text-indigo-400">Ship work, together.</span>
                        </h1>
                        <p
                            className={`mx-auto mt-6 max-w-2xl text-lg text-gray-600 transition-all delay-100 duration-700 dark:text-gray-400 ${
                                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                            }`}
                        >
                            Synkro is a collaborative project and task management platform with real review workflows, live notifications, activity logs, deadline calendars, and personal reminders, built for teams that actually want to ship.
                        </p>
                        <div
                            className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all delay-200 duration-700 ${
                                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                            }`}
                        >
                            {auth.user ? (
                                <>
                                    <Link href={route('projects.index')} className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md">
                                        Go to Projects
                                    </Link>
                                    <Link href={route('feedback.page')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                        Help / Feedback
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={route('register')} className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md">
                                        Create an Account
                                    </Link>
                                    <Link href={route('login')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                        Log in
                                    </Link>
                                    <Link href={route('feedback.page')} className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                                        Help / Feedback
                                    </Link>
                                </>
                            )}
                        </div>

                        <div
                            className={`transition-all delay-300 duration-700 ${
                                heroVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                            }`}
                        >
                            <StatStrip stats={liveStats} />
                        </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-6 pb-20">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, i) => (
                                <FeatureCard key={feature.title} feature={feature} index={i} />
                            ))}
                        </div>
                    </section>

                    <section className="relative overflow-hidden bg-gray-950 px-6 py-20 text-center">
                        <RadarRings ringClassName="border-indigo-400/25" size="h-64 w-64" />
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">
                            {auth.user ? 'Your projects are waiting.' : "Your team's next project starts here."}
                        </h2>
                        <p className="mx-auto mt-3 max-w-md text-gray-400">
                            {auth.user
                                ? 'Pick up where you left off, or start something new.'
                                : `Join ${liveStats.users.toLocaleString()} people already managing work on Synkro.`}
                        </p>
                        <div className="mt-8">
                            <Link
                                href={route(auth.user ? 'projects.index' : 'register')}
                                className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md"
                            >
                                {auth.user ? 'Go to Projects' : 'Create an Account'}
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
                    Synkro was built as a PFA project at Kernel Solution &amp; Innovation
                </footer>
            </div>
        </>
    );
}
