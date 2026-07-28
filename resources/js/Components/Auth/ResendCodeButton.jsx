import { useEffect, useState } from 'react';
import Spinner from '@/Components/Spinner';

/**
 * "Resend code" control with a visible countdown. Disabled for
 * `cooldownSeconds` after each successful send (starts already counting
 * down on mount, since a code was just sent to land on this screen in the
 * first place), and re-enables itself the moment the countdown hits zero.
 */
export default function ResendCodeButton({ onResend, cooldownSeconds = 20, disabled = false, label = "Didn't get a code? Resend" }) {
    const [cooldown, setCooldown] = useState(cooldownSeconds);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, [cooldown > 0]);

    const handleClick = async () => {
        if (disabled || sending || cooldown > 0) return;

        setSending(true);
        try {
            await onResend();
            setCooldown(cooldownSeconds);
        } catch {
            // Leave the cooldown at 0 so the person can try again right away.
        } finally {
            setSending(false);
        }
    };

    const isDisabled = disabled || sending || cooldown > 0;

    return (
        <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <button
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 dark:text-indigo-400 dark:hover:text-indigo-300 dark:disabled:text-gray-500"
            >
                {sending && <Spinner className="h-3.5 w-3.5" />}
                {sending ? 'Sending...' : cooldown > 0 ? `Resend code (${cooldown}s)` : label}
            </button>

            {cooldown > 0 && (
                <div className="h-1 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full rounded-full bg-indigo-500 transition-[width] duration-1000 ease-linear dark:bg-indigo-400"
                        style={{ width: `${(cooldown / cooldownSeconds) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
