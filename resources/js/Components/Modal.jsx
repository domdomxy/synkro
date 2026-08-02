import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
    overlayClassName = 'bg-gray-500/75 dark:bg-gray-900/75',
    panelClassName = 'bg-white dark:bg-gray-800',
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'sm:max-w-6xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" id="modal" className="fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0" onClose={close}>
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    {/* No onClick here: Headless UI v2's Dialog already treats a click on
                        this backdrop as an outside click and calls the Dialog's own
                        onClose (wired to `close` above) by itself. Adding a second
                        onClick={close} here used to fire `close` twice per click, which
                        for panels wired through useRouteOverlay's close() (window.history.back())
                        meant one click silently consumed two history entries instead of one. */}
                    <div className={`absolute inset-0 ${overlayClassName}`} />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
                    enterTo="translate-y-0 opacity-100 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                    leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel className={`mb-6 w-full transform overflow-hidden rounded-lg shadow-xl transition-all sm:mx-auto ${panelClassName} ${maxWidthClass}`}>
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}