import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
    overlayClassName = 'bg-gray-500/75 dark:bg-gray-900/75',
    panelClassName = 'bg-white dark:bg-gray-800',
    // Panel clips to its rounded corners by default (overflow-hidden), which also
    // clips any absolutely-positioned floating content inside it - e.g. a
    // FilterSelect's open options list gets cut off instead of extending past the
    // panel edge the way it would outside a modal. Pass true for modals that host
    // this kind of floating content so it can render in full.
    overflowVisible = false,
}) {
    // With `items-center` on the wrapping flex container, a panel taller than the
    // viewport overflows equally above and below center. The container can only
    // scroll down from 0 (scrollTop can't go negative), so the portion that
    // overflowed above the top of the screen becomes permanently unreachable -
    // the modal renders "cut off" at the top with no way to scroll up to it.
    // Capping the panel's own height to the viewport and scrolling *inside* it
    // instead keeps centering intact for short content while guaranteeing every
    // pixel of tall content (long lists, forms, etc.) stays reachable, on both
    // desktop and short mobile viewports.
    //
    // The cap has to match the vertical space actually consumed outside the
    // panel, or it's wrong in both directions. That space is the Dialog
    // wrapper's own py-6 (1.5rem top + 1.5rem bottom = 3rem) plus the
    // DialogPanel's own mb-6 (1.5rem, bottom only) = 4.5rem total - not the
    // 6rem this used to subtract. That extra 1.5rem of unaccounted-for
    // "safety margin" made the cap stricter than the panel could ever
    // actually need, which for a panel that already self-caps its inner
    // content (e.g. SettingsPanel/AccountPanel/FeedbackPanel's own
    // `h-[88vh] max-h-[860px]`) meant the outer max-height came in a few
    // pixels *below* that inner height on plenty of ordinary desktop
    // viewports - just enough overflow to keep a persistent, mostly-empty
    // scrollbar on screen with nothing meaningful to scroll to.
    const overflowClass = overflowVisible ? 'overflow-visible' : 'thin-scrollbar max-h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden';

    // The outer Dialog wrapper below only needs its own scrollbar when the
    // panel itself has no height cap (overflowVisible) and so can genuinely
    // grow taller than the viewport. Every other panel already caps itself
    // to max-h-[calc(100vh-6rem)] and scrolls internally (see overflowClass
    // above), so giving the outer wrapper overflow-y-auto too was redundant -
    // it produced its own empty scrollbar (visible along the very edge of
    // the screen) even when the panel content fit on screen with nothing to
    // scroll, since the wrapper is always exactly viewport height.
    const outerOverflowClass = overflowVisible ? 'overflow-y-auto' : 'overflow-y-hidden';

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
        '7xl': 'sm:max-w-7xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="duration-200">
            <Dialog as="div" id="modal" className={`fixed inset-0 z-[60] flex transform items-center px-4 py-6 transition-all sm:px-0 ${outerOverflowClass}`} onClose={close}>
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
                    <DialogPanel className={`mb-6 w-full transform ${overflowClass} rounded-lg shadow-xl transition-all sm:mx-auto ${panelClassName} ${maxWidthClass}`}>
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}