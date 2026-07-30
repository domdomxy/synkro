import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
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
        description: 'Owners, managers, members, and testers each get exactly the permissions that fit their role, scoped per project rather than global. Change roles on the fly, transfer ownership, or leave a project whenever you need to.',
        icon: <path d="M9 11a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H2zm15-9a4 4 0 100-8 4 4 0 000 8zm-1.5 1.5c.49-.13 1-.2 1.5-.2a6 6 0 016 6H17a7.97 7.97 0 00-3.5-6.6V12.5z" />,
        accent: 'indigo',
    },
    {
        title: 'Full task lifecycle',
        description: 'Tasks move from todo → in progress → submitted → in review → done. Attach files or links as deliverables, discuss them in threaded comments with @mentions, and get a full tester approval gate before anything is marked complete.',
        icon: <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />,
        accent: 'teal',
    },
    {
        title: 'Live notifications',
        description: 'Task assignments, review decisions, comments and mentions, role changes, member joins and departures: every meaningful event arrives live via WebSocket. A persistent notification center with category filters and per-type email toggles keeps you in control of what reaches your inbox.',
        icon: <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
        accent: 'amber',
    },
    {
        title: 'Activity logs',
        description: 'Every action on a project is logged: member changes, role updates, task edits, and ownership transfers. Sign-ins get their own dedicated history too, with device, browser, and location on every login, plus an instant email alert you can turn off anytime.',
        icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />,
        accent: 'pink',
    },
    {
        title: 'Personal dashboard',
        description: 'A full activity chart, deadline calendar with week/month/year views, due-soon alerts, task status breakdown, and personal reminders: everything you need to stay on top of your work.',
        icon: <path d="M16 8v8m-4-5v5m-4-2v2M4 20h16a1 1 0 001-1V6a1 1 0 00-1-1H4a1 1 0 00-1 1v13a1 1 0 001 1z" />,
        accent: 'indigo',
    },
    {
        title: 'Platform admin',
        description: 'A dedicated admin panel for managing users and overseeing platform activity: suspend or reinstate accounts through a built-in appeals process, reset passwords, triage support tickets, change global roles, and review a full audit log of every admin action, separate from project-level permissions.',
        icon: <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zm0 4.2L7 8.5v3.7c0 3.4 2.3 6.1 5 7.2 2.7-1.1 5-3.8 5-7.2V8.5l-5-2.3z" />,
        accent: 'teal',
    },
];

// A genuine sequence, not a decorative one: this is the actual path a task takes through
// Synkro, in order, so numbering it and connecting the steps with a line encodes something
// true rather than just styling a list.
const steps = [
    {
        n: '01',
        title: 'Create a project',
        description: 'Set up a project and invite your team, each person with the role that fits them: owner, manager, member, or tester.',
    },
    {
        n: '02',
        title: 'Assign the work',
        description: 'Break it into tasks, set priorities and due dates, and assign each one to the person doing it.',
    },
    {
        n: '03',
        title: 'Move it through review',
        description: 'Tasks go from in progress to submitted to in review, deliverables attached, discussed right there in threaded comments.',
    },
    {
        n: '04',
        title: 'Ship it, tracked',
        description: 'A tester approves the work, it gets marked done, and the whole history stays in the activity log.',
    },
];

const securityPoints = [
    {
        title: 'Instant session termination',
        description: 'Suspensions, admin password resets, and account deletions broadcast in real time, logging out every open tab immediately.',
    },
    {
        title: 'Password protection',
        description: 'A live strength meter guides every new password, and admin-issued temporary passwords expire automatically after 24 hours.',
    },
    {
        title: 'Safer outbound links',
        description: 'External links get a confirmation prompt before you leave Synkro, with a trusted-sites list so you are only asked once per host.',
    },
    {
        title: 'Full accountability',
        description: 'Every admin action, from a role change to a password reset, is written to a permanent audit log.',
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

// Subtle glow that follows the cursor across the hero, desktop-only (pointer:fine) so it never
// costs anything on touch devices, and always low-opacity so it reads as atmosphere, not a
// second spotlight fighting the radar rings for attention.
function HeroSpotlight() {
    const ref = useRef(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        if (typeof window !== 'undefined' && !window.matchMedia?.('(pointer: fine)').matches) return;

        const handleMove = (e) => {
            const rect = node.parentElement.getBoundingClientRect();
            node.style.setProperty('--x', `${e.clientX - rect.left}px`);
            node.style.setProperty('--y', `${e.clientY - rect.top}px`);
            node.style.opacity = '1';
        };
        const handleLeave = () => { node.style.opacity = '0'; };

        const parent = node.parentElement;
        parent.addEventListener('mousemove', handleMove);
        parent.addEventListener('mouseleave', handleLeave);
        return () => {
            parent.removeEventListener('mousemove', handleMove);
            parent.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500"
            style={{
                background: 'radial-gradient(480px circle at var(--x, 50%) var(--y, 0px), rgba(79, 70, 229, 0.08), transparent 70%)',
            }}
        />
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
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${accent.iconBg} ${accent.iconText}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    {feature.icon}
                </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{feature.description}</p>
        </div>
    );
}

function StepItem({ step, index }) {
    const [ref, visible] = useFadeInOnScroll();
    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${index * 90}ms` }}
            className={`relative flex items-start gap-4 transition-all duration-500 sm:flex-col sm:items-center sm:gap-0 sm:text-center ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
        >
            <span
                style={MONO}
                className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-gray-50 text-sm font-bold text-indigo-600 dark:bg-gray-900 dark:text-indigo-400"
            >
                {step.n}
            </span>
            <div className="sm:mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
            </div>
        </div>
    );
}

export default function Welcome({ auth, stats }) {
    const [heroVisible, setHeroVisible] = useState(false);
    const [liveStats, setLiveStats] = useState(stats ?? { users: 0, projects: 0, tasks: 0 });
    const [scrolled, setScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setHeroVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    // rAF-throttled: only the header's blur/shadow state, the top progress bar's scaleX, and
    // the back-to-top button's visibility read from this, so one listener covers all three
    // instead of three separate ones each re-measuring the page.
    useEffect(() => {
        let ticking = false;
        const measure = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY;
            const scrollable = doc.scrollHeight - doc.clientHeight;
            setScrolled(scrollTop > 24);
            setShowBackToTop(scrollTop > 640);
            setScrollProgress(scrollable > 0 ? Math.min(1, scrollTop / scrollable) : 0);
            ticking = false;
        };
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(measure);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        measure();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Public (not private) channel: this page is reachable by guests who
    // aren't authenticated at all, so there's no user to authorize a private
    // channel subscription against.
    useEchoPublic('platform-stats', '.stats.updated', (payload) => {
        setLiveStats({ users: payload.users, projects: payload.projects, tasks: payload.tasks });
    });

    return (
        <>
            <Head title="Welcome" />
            <style>{`
                html { scroll-behavior: smooth; }
                @media (prefers-reduced-motion: reduce) {
                    html { scroll-behavior: auto; }
                }
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
                <div
                    aria-hidden="true"
                    className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-indigo-500 transition-transform duration-150 ease-out"
                    style={{ transform: `scaleX(${scrollProgress})` }}
                />

                <header
                    className={`sticky top-0 z-40 transition-all duration-300 ${
                        scrolled
                            ? 'border-b border-gray-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-900/80'
                            : 'border-b border-transparent bg-transparent'
                    }`}
                >
                    <div className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xl font-bold">Synkro</span>
                        </div>

                        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400 sm:flex">
                            <a href="#how-it-works" className="transition hover:text-gray-900 dark:hover:text-gray-100">How it works</a>
                            <a href="#features" className="transition hover:text-gray-900 dark:hover:text-gray-100">Features</a>
                            <a href="#security" className="transition hover:text-gray-900 dark:hover:text-gray-100">Security</a>
                        </nav>

                        <nav className="ml-auto flex items-center gap-3">
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
                    </div>
                </header>

                <main>
                    <section className="relative mx-auto max-w-4xl px-6 py-20 text-center">
                        <RadarRings />
                        <HeroSpotlight />

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
                            Real review workflows, live notifications, and deadline calendars, with account security built in from the start,
                            for teams that actually want to ship.
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

                    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-20">
                        <div className="mx-auto max-w-2xl text-center">
                            <span style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500 dark:text-indigo-400">
                                How it works
                            </span>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                                Four steps, start to done
                            </h2>
                            <p className="mt-3 text-gray-500 dark:text-gray-400">
                                The same path every task takes on Synkro, from the moment a project exists to the moment work is shipped.
                            </p>
                        </div>
                        <div className="relative mx-auto mt-14 max-w-5xl">
                            <div
                                aria-hidden="true"
                                className="absolute top-6 hidden h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 sm:block"
                                style={{ left: '12.5%', right: '12.5%' }}
                            />
                            <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-4 sm:gap-6">
                                {steps.map((step, i) => (
                                    <StepItem key={step.n} step={step} index={i} />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-20">
                        <div className="mx-auto max-w-2xl text-center">
                            <span style={MONO} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500 dark:text-indigo-400">
                                What's inside
                            </span>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                                Everything your team needs, in one place
                            </h2>
                            <p className="mt-3 text-gray-500 dark:text-gray-400">
                                No plugins to configure and no separate tools to stitch together, it's all here by default.
                            </p>
                        </div>
                        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, i) => (
                                <FeatureCard key={feature.title} feature={feature} index={i} />
                            ))}
                        </div>
                    </section>

                    <section id="security" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-20">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800 sm:p-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Built with security in mind</h2>
                            </div>
                            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                                {securityPoints.map((point) => (
                                    <div key={point.title} className="flex gap-3">
                                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{point.title}</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{point.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                    Synkro was built as a PFA project at{' '}
                    <a
                        href="https://www.kernelsi.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:decoration-gray-600 dark:hover:text-gray-200"
                    >
                        Kernel Solution &amp; Innovation
                    </a>
                    <span className="mx-2 text-gray-300 dark:text-gray-700">&middot;</span>
                    <Link href={route('privacy')} className="hover:text-gray-700 dark:hover:text-gray-200">Privacy</Link>
                    <span className="mx-2 text-gray-300 dark:text-gray-700">&middot;</span>
                    <Link href={route('terms')} className="hover:text-gray-700 dark:hover:text-gray-200">Terms of Use</Link>
                </footer>

                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Back to top"
                    className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-100 ${
                        showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                    }`}
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>
        </>
    );
}
