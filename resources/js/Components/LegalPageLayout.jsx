import ApplicationLogo from '@/Components/ApplicationLogo';
import BackButton from '@/Components/BackButton';
import { Link } from '@inertiajs/react';

/**
 * Shared shell for public, unauthenticated legal pages (Privacy Policy,
 * Terms of Use). Mirrors the Welcome page's header/footer so these don't
 * feel like a different app, but keeps a wide readable content column
 * instead of Welcome's centered marketing layout.
 */
export default function LegalPageLayout({ title, updatedAt, children }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ApplicationLogo className="h-8 w-8 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xl font-bold">Synkro</span>
                </Link>
                <BackButton href="/" label="Back to Home" />
            </header>

            <main className="mx-auto max-w-3xl px-6 pb-20 pt-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                {updatedAt && <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Last updated {updatedAt}</p>}
                <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {children}
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
