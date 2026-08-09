import { useState } from 'react';

// Renders a bold ID with a small copy button next to it, for IDs an admin is
// likely to want to paste elsewhere while triaging (e.g. a feedback tracking
// ID in the logs). navigator.clipboard requires a secure context (HTTPS or
// localhost) and isn't available in every mobile browser/webview, so fall
// back to the old execCommand approach via a temporary textarea when it's
// missing.
export default function CopyableId({ id, className = '' }) {
    const [copied, setCopied] = useState(false);

    const copy = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(id);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = id;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Clipboard write can be denied by browser permissions; fail silently.
        }
    };

    return (
        <span className="inline-flex items-center gap-1 align-middle">
            <strong className={className}>{id}</strong>
            <span
                role="button"
                tabIndex={0}
                onClick={copy}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') copy(e);
                }}
                aria-label={copied ? 'Copied' : 'Copy ID'}
                title={copied ? 'Copied' : 'Copy ID'}
                className="inline-flex shrink-0 cursor-pointer items-center rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                {copied ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                )}
            </span>
        </span>
    );
}
