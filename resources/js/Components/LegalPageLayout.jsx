import ApplicationLogo from '@/Components/ApplicationLogo';
import BackButton from '@/Components/BackButton';
import { Link } from '@inertiajs/react';

/**
 * Shared shell for public, unauthenticated legal pages (Privacy Policy,
 * Terms of Use). Mirrors the Welcome page's header/footer so these don't
 * feel like a different app.
 *
 * Takes `sections` (an ordered array of { id, title, body }) rather than
 * raw children, the same array-driven pattern Welcome.jsx uses for its
 * features/steps - it lets this layout render the section nav and the
 * content from one source instead of keeping two things in sync by hand.
 */
export default function LegalPageLayout({ title, updatedAt, icon, intro, sections = [] }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold">Synkro</span>
                </Link>
                <BackButton href="/" label="Back to Home" />
            </header>

            <main className="mx-auto max-w-5xl px-6 pb-20 pt-4">
                <div className="flex items-start gap-4">
                    {icon && (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                                {icon}
                            </svg>
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                        {updatedAt && (
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                Last updated {updatedAt}
                            </span>
                        )}
                    </div>
                </div>
                {intro && <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">{intro}</p>}

                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
                    <nav aria-label="Sections" className="hidden lg:block">
                        <div className="sticky top-8 space-y-1 border-l border-gray-200 pl-4 dark:border-gray-700">
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    className="block py-1 text-sm text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                                >
                                    {section.title}
                                </a>
                            ))}
                        </div>
                    </nav>

                    {/* Mobile-only jump list, since the sticky side nav is hidden below lg */}
                    <nav aria-label="Sections" className="-mx-1 flex flex-wrap gap-2 lg:hidden">
                        {sections.map((section) => (
                            <a
                                key={section.id}
                                href={`#${section.id}`}
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>

                    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800 sm:p-8">
                        <div className="prose-legal space-y-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {sections.map((section, i) => (
                                <section key={section.id} id={section.id} className={`scroll-mt-8 ${i > 0 ? 'border-t border-gray-100 pt-8 dark:border-gray-700' : ''}`}>
                                    <h2 className="!mb-2 !mt-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
                                    {section.body}
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
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
        </div>
    );
}
