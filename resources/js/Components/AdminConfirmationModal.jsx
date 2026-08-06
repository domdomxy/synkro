import { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import OtpInput from '@/Components/Auth/OtpInput';
import ResendCodeButton from '@/Components/Auth/ResendCodeButton';
import Spinner from '@/Components/Spinner';
import { router, usePage } from '@inertiajs/react';

const RESEND_COOLDOWN_SECONDS = 20;

/**
 * Step-up confirmation modal for irreversible admin actions. The moment it
 * opens, it emails a fresh 6-digit code to the acting superadmin's own
 * address (proving continued inbox access, on top of the session they're
 * already authenticated with) via admin.users.send-confirmation-code. Once
 * they enter it, the code - not this component - is what actually authorizes
 * anything: `onVerify(code)` is responsible for performing the real action
 * server-side and should resolve on success, or reject with an error string
 * (e.g. "The code you entered is incorrect.") to show under the code boxes.
 *
 * `purpose` must match a value AdminController::sendConfirmationCode() and
 * User::verifyAdminConfirmationCode() both accept - it scopes the code
 * server-side so one issued here can't be replayed for a different action.
 */
export default function AdminConfirmationModal({ show, purpose, title, description, confirmLabel = 'Confirm', danger = true, onVerify, onClose }) {
    const { auth } = usePage().props;
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [initialSendFailed, setInitialSendFailed] = useState(false);

    const sendCode = () =>
        new Promise((resolve, reject) => {
            router.post(
                route('admin.users.send-confirmation-code'),
                { purpose },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => resolve(),
                    onError: () => reject(),
                }
            );
        });

    // Seed a code the instant the modal opens, and reset everything else so a
    // previous attempt (code, error) doesn't leak into a fresh confirmation.
    useEffect(() => {
        if (!show) return;
        setCode('');
        setError('');
        setInitialSendFailed(false);
        sendCode().catch(() => setInitialSendFailed(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    const retryInitialSend = () => {
        setInitialSendFailed(false);
        sendCode().catch(() => setInitialSendFailed(true));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length !== 6 || sending) return;

        setSending(true);
        setError('');
        try {
            await onVerify(code);
        } catch (err) {
            setError(typeof err === 'string' && err ? err : 'Something went wrong. Please try again.');
            setCode('');
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal show={!!show} onClose={sending ? () => {} : onClose} maxWidth="sm" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">{title}</h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {description} We've sent a 6-digit code to{' '}
                    {auth?.user?.email && <span className="font-medium text-neutral-800 dark:text-neutral-200">{auth.user.email}</span>}.
                </p>

                {initialSendFailed ? (
                    <p className="mt-5 text-sm text-red-600 dark:text-red-400">
                        Couldn't send a confirmation code.{' '}
                        <button type="button" onClick={retryInitialSend} className="font-medium underline hover:no-underline">
                            Try again
                        </button>
                        .
                    </p>
                ) : (
                    <div className="mt-5">
                        <OtpInput length={6} value={code} onChange={setCode} error={error} autoFocus disabled={sending} />
                    </div>
                )}

                <div className="mt-4">
                    <ResendCodeButton onResend={sendCode} cooldownSeconds={RESEND_COOLDOWN_SECONDS} disabled={sending} />
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={sending || code.length !== 6 || initialSendFailed}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-neutral-800 ${
                            danger
                                ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500'
                                : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500'
                        }`}
                    >
                        {sending && <Spinner className="h-4 w-4" />}
                        {sending ? 'Confirming...' : confirmLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
