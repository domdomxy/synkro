import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';

function CloseIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function BellSlashIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

function MailIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function BothIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9M3 3l18 18" />
        </svg>
    );
}

const OPTIONS = [
    { value: 'in_app', label: 'In-app only', description: 'Keep the emails, mute the bell notifications.', Icon: BellSlashIcon },
    { value: 'email', label: 'Email only', description: 'Keep the bell notifications, mute the emails.', Icon: MailIcon },
    { value: 'both', label: 'Both', description: 'Mute in-app and email notifications.', Icon: BothIcon },
];

export default function MuteScopeDialog({ open, title, message, defaultScope = 'both', confirmLabel = 'Mute', onConfirm, onCancel }) {
    const [scope, setScope] = useState(defaultScope);

    // Re-sync whenever the dialog is (re-)opened, so a stale selection from a
    // previous task/project doesn't leak into this one.
    useEffect(() => {
        if (open) setScope(defaultScope);
    }, [open, defaultScope]);

    return (
        <Modal show={!!open} onClose={onCancel} maxWidth="sm" overlayClassName="bg-black/55 dark:bg-black/70">
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        {title && <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h2>}
                        <p className={`text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 ${title ? 'mt-1.5' : ''}`}>{message}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="shrink-0 rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    {OPTIONS.map(({ value, label, description, Icon }) => (
                        <label
                            key={value}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition ${
                                scope === value
                                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10'
                                    : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/40'
                            }`}
                        >
                            <input
                                type="radio"
                                name="mute-scope"
                                value={value}
                                checked={scope === value}
                                onChange={() => setScope(value)}
                                className="mt-0.5 h-4 w-4 shrink-0 border-neutral-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-600 dark:bg-neutral-800"
                            />
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                            <span>
                                <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">{label}</span>
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400">{description}</span>
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(scope)}
                        autoFocus
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
