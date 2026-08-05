import FlashMessages from '@/Components/FlashMessages';
import NotificationToast from '@/Components/NotificationToast';

// FlashMessages (server flash/error redirects) and NotificationToast
// (real-time broadcasts) each keep their own independent toast queue, but
// both need to land in the same bottom-right corner. Previously each owned
// its own `fixed bottom-4 right-4` container, so whenever both had toasts up
// at once the two stacks rendered directly on top of each other. This is the
// single shared container both lists render into instead, so everything
// stacks in one column regardless of which source produced it.
export default function ToastLayer() {
    return (
        <div className="fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:w-auto sm:max-w-sm sm:translate-x-0">
            <FlashMessages />
            <NotificationToast />
        </div>
    );
}
