import { useEffect, useRef, useState } from 'react';
import InputError from '@/Components/InputError';

function ClipboardIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-5 8l2 2 4-4"
            />
        </svg>
    );
}

/**
 * Segmented one-time-code entry: one box per digit.
 *
 *  - Typing auto-advances to the next box; Backspace on an empty box steps
 *    back to the previous one; arrow keys move between boxes.
 *  - Pasting (Ctrl/Cmd+V) into any box distributes the full code across all
 *    boxes at once, so copying a code straight out of an email works
 *    without any extra clicks.
 *  - A "paste from clipboard" button is also offered where the Clipboard
 *    API is available, for anyone who'd rather tap than use a keyboard
 *    shortcut (e.g. switching in from the Mail app on a phone).
 */
export default function OtpInput({ length = 6, value = '', onChange, error, autoFocus = false, disabled = false }) {
    const inputsRef = useRef([]);
    const [pasteSupported, setPasteSupported] = useState(false);

    useEffect(() => {
        setPasteSupported(typeof navigator !== 'undefined' && !!navigator.clipboard?.readText);
    }, []);

    useEffect(() => {
        if (autoFocus) inputsRef.current[0]?.focus();
    }, [autoFocus]);

    const digits = Array.from({ length }, (_, i) => value[i] || '');

    const setDigitAt = (index, char) => {
        const next = digits.slice();
        next[index] = char;
        onChange(next.join(''));
    };

    const applyCode = (raw) => {
        const clean = raw.replace(/\D/g, '').slice(0, length);
        if (!clean) return;
        onChange(clean);
        const focusIndex = Math.min(clean.length, length - 1);
        requestAnimationFrame(() => inputsRef.current[focusIndex]?.focus());
    };

    const handleChange = (index, raw) => {
        const clean = raw.replace(/\D/g, '');

        // Multiple digits landing in one box usually means a paste or an
        // OS/keyboard autofill suggestion rather than normal typing.
        if (clean.length > 1) {
            applyCode(clean);
            return;
        }

        setDigitAt(index, clean);
        if (clean && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
            setDigitAt(index - 1, '');
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault();
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        applyCode(e.clipboardData.getData('text'));
    };

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            applyCode(text);
        } catch {
            // Permission denied or unavailable - native Ctrl/Cmd+V paste into
            // any box above still works as a fallback.
        }
    };

    return (
        <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="grid flex-1 grid-cols-6 gap-1.5 sm:gap-2" onPaste={handlePaste}>
                    {digits.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputsRef.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            maxLength={length}
                            value={digit}
                            disabled={disabled}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            aria-label={`Digit ${index + 1} of ${length}`}
                            className={`h-11 w-full min-w-0 rounded-lg border bg-white text-center text-base font-semibold tabular-nums text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:opacity-60 sm:h-12 sm:text-lg dark:bg-gray-900 dark:text-gray-100 ${
                                error
                                    ? 'border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500/60 dark:focus:ring-red-500/30'
                                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 dark:border-gray-600 dark:focus:ring-indigo-500/30'
                            }`}
                        />
                    ))}
                </div>

                {pasteSupported && (
                    <button
                        type="button"
                        onClick={pasteFromClipboard}
                        disabled={disabled}
                        title="Paste code from clipboard"
                        aria-label="Paste code from clipboard"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                    >
                        <ClipboardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                )}
            </div>
            <InputError message={error} className="mt-2" />
        </div>
    );
}
