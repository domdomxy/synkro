import { useEffect, useState } from 'react';
import Modal from '@/Components/Modal';

function CloseIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function ClockIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </svg>
    );
}

function TrashIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 7h16M9 7V4h6v3m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
        </svg>
    );
}

// Radio-style selectable card used when a ConfirmDialog is opened with `choices`.
function ChoiceCard({ choice, checked, onSelect }) {
    const tone = choice.danger ? 'danger' : 'neutral';

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={checked}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 ${
                checked
                    ? tone === 'danger'
                        ? 'border-red-500 bg-red-50 focus-visible:ring-red-500 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-indigo-500 bg-indigo-50 focus-visible:ring-indigo-500 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 focus-visible:ring-indigo-500 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-700/40'
            }`}
        >
            <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    checked
                        ? tone === 'danger'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                        : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500'
                }`}
            >
                {choice.icon === 'trash' ? <TrashIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${checked && tone === 'danger' ? 'text-red-700 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {choice.label}
                    </span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{choice.description}</span>
            </span>
            <span
                className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked
                        ? tone === 'danger'
                            ? 'border-red-500'
                            : 'border-indigo-500'
                        : 'border-neutral-300 dark:border-neutral-600'
                }`}
            >
                {checked && <span className={`h-2 w-2 rounded-full ${tone === 'danger' ? 'bg-red-500' : 'bg-indigo-500'}`} />}
            </span>
        </button>
    );
}

export default function ConfirmDialog({ open, title, message, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', choices, hideCancel = false, onConfirm, onCancel }) {
    const hasChoices = Array.isArray(choices) && choices.length > 0;
    const defaultChoice = hasChoices ? (choices.find((c) => c.default) ?? choices[0]).value : null;
    const [selected, setSelected] = useState(defaultChoice);

    // Reset the selection back to the default choice each time the dialog opens, so a
    // previous pick from an earlier confirm() call doesn't leak into this one.
    useEffect(() => {
        if (open) setSelected(defaultChoice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const selectedChoice = hasChoices ? choices.find((c) => c.value === selected) : null;
    const isDanger = hasChoices ? !!selectedChoice?.danger : !!danger;
    const finalConfirmLabel = selectedChoice?.confirmLabel ?? confirmLabel;

    const handleConfirm = () => onConfirm(hasChoices ? selected : true);

    // Uses neutral-* instead of gray-* on purpose: this project's tailwind.config.js
    // remaps gray to a bluish slate palette app-wide, but this dialog is styled to match
    // Claude.ai's own confirmation dialog, which reads as true neutral gray with no blue tint.
    return (
        <Modal
            show={!!open}
            onClose={onCancel}
            maxWidth={hasChoices ? 'md' : 'sm'}
            overlayClassName="bg-black/55 dark:bg-black/70"
        >
            <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        {title && <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">{title}</h2>}
                        <p className={`text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300 ${title ? 'mt-2.5' : ''}`}>{message}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="shrink-0 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {hasChoices && (
                    <div className="mt-5 space-y-2.5" role="radiogroup" aria-label={title}>
                        {choices.map((choice) => (
                            <ChoiceCard
                                key={choice.value}
                                choice={choice}
                                checked={selected === choice.value}
                                onSelect={() => setSelected(choice.value)}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2.5">
                    {!hideCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        autoFocus
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 ${
                            isDanger
                                ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500'
                                : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500'
                        }`}
                    >
                        {finalConfirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
