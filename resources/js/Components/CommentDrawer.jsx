import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

// A sheet that slides up from the bottom edge of the screen, for the mobile
// comments view - unlike the inline accordion TaskRow expands into on
// desktop, small screens don't have the width for a comment thread once
// replies start nesting, so tapping "Comments" opens this instead.
//
// The handle bar is a deliberate stand-in for the native "drag down to
// dismiss" affordance (no swipe gesture is wired up here) but it's still a
// real tap target that closes the sheet, on top of the backdrop-tap/Esc
// that Dialog already gives us for free.
export default function CommentDrawer({ show, onClose, title = 'Comments', count, children }) {
    return (
        <Dialog open={show} onClose={onClose} className="fixed inset-0 z-[60] sm:hidden">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/55 duration-200 ease-out data-closed:opacity-0 data-leave:duration-150 data-leave:ease-in dark:bg-black/70"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 flex max-h-full">
                    <DialogPanel
                        transition
                        className="flex w-full transform flex-col duration-300 ease-in-out data-closed:translate-y-full data-leave:duration-200"
                    >
                        <div className="flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl dark:bg-gray-800">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close comments"
                                className="flex shrink-0 items-center justify-center py-2.5"
                            >
                                <span className="h-1 w-9 rounded-full bg-gray-300 dark:bg-gray-600" />
                            </button>

                            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 pb-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {title}
                                    {count > 0 ? ` (${count})` : ''}
                                </h2>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto p-3">
                                {children}
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
