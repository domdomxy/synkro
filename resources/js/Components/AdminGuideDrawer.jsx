import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

// A panel that slides in from the right edge of the screen, not a centered
// box like Modal/ConfirmDialog use. Admins can leave this open and glance at
// it while they work a ticket or appeal, rather than it feeling like a
// one-off "are you sure?" prompt they have to dismiss before continuing.
//
// Uses Dialog's own `open`/`transition` API (Headless UI v2.1+) instead of
// wrapping it in an external <Transition show>: the external-wrapper pattern
// is what left a still-focused element behind an aria-hidden ancestor
// whenever this drawer opened alongside another already-open dialog, which
// Chrome flags as a "Blocked aria-hidden" warning.

const toneStyles = {
    do: {
        wrap: 'border-green-100 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20',
        heading: 'text-green-700 dark:text-green-400',
        icon: 'M5 13l4 4L19 7',
    },
    dont: {
        wrap: 'border-red-100 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20',
        heading: 'text-red-700 dark:text-red-400',
        icon: 'M6 18L18 6M6 6l12 12',
    },
    neutral: {
        wrap: 'border-sky-100 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20',
        heading: 'text-sky-700 dark:text-sky-400',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    },
    example: {
        wrap: 'border-indigo-100 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/20',
        heading: 'text-indigo-700 dark:text-indigo-400',
        icon: 'M8 9h8M8 13h6m-9 8V5a2 2 0 012-2h10a2 2 0 012 2v11.586a1 1 0 01-.293.707l-3.414 3.414a1 1 0 01-.707.293H5a2 2 0 01-2-2z',
    },
    scenario: {
        wrap: 'border-amber-100 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20',
        heading: 'text-amber-700 dark:text-amber-400',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
};

function GuideSection({ heading, tone = 'neutral', items }) {
    const style = toneStyles[tone] ?? toneStyles.neutral;
    return (
        <div className={`rounded-lg border p-4 ${style.wrap}`}>
            <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${style.heading}`}>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                </svg>
                {heading}
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {items.map((item, i) => (
                    <li key={i}>
                        {typeof item === 'string' ? item : (
                            <>
                                {item.label && <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}: </span>}
                                {item.text}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function AdminGuideDrawer({ show, onClose, title, intro, sections }) {
    return (
        <Dialog open={show} onClose={onClose} className="fixed inset-0 z-[60]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/55 duration-200 ease-out data-closed:opacity-0 data-leave:duration-150 data-leave:ease-in dark:bg-black/70"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-y-0 right-0 flex max-w-full">
                    <DialogPanel
                        transition
                        className="w-screen max-w-md transform duration-300 ease-in-out data-closed:translate-x-full data-leave:duration-200 sm:max-w-lg"
                    >
                        <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
                            <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        {title}
                                    </h2>
                                    {intro && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{intro}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close"
                                    className="shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                {sections.map((section, i) => (
                                    <GuideSection key={i} {...section} />
                                ))}
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
