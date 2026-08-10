import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import SecondaryButton from '@/Components/SecondaryButton';
import RichTextContent from '@/Components/RichTextContent';

// Slides in from the right edge, like AdminGuideDrawer, rather than a centered
// modal box. Project info is reference material someone keeps open and glances
// back at while they work rather than a one-off prompt to dismiss, so it gets
// the same drawer treatment.

export default function ProjectInfoModal({ show, onClose, project }) {
    const formatTimestamp = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <Transition show={show} leave="duration-150">
            <Dialog as="div" className="fixed inset-0 z-[60]" onClose={onClose}>
                <TransitionChild
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/55 dark:bg-black/70" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 right-0 flex max-w-full">
                        <TransitionChild
                            enter="transform transition ease-in-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in-out duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <DialogPanel className="w-screen max-w-md sm:max-w-2xl">
                                <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-800">
                                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 p-6 pb-4 dark:border-gray-700">
                                        <div className="min-w-0">
                                            <h2 className="break-words text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h2>
                                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Project ID: {project.id}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Created {formatTimestamp(project.created_at)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Last updated {formatTimestamp(project.updated_at)}
                                                </span>
                                            </div>
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

                                    <div className="flex-1 overflow-y-auto p-6 pt-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Description</p>
                                        <RichTextContent
                                            className="mt-2 whitespace-pre-wrap break-words text-base text-gray-900 dark:text-gray-100"
                                            style={{ tabSize: 4 }}
                                            html={project.description}
                                            fallback='<span class="text-gray-400">No description provided.</span>'
                                        />
                                    </div>

                                    <div className="flex justify-end border-t border-gray-100 p-4 dark:border-gray-700">
                                        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
