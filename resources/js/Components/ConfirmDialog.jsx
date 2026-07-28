import Modal from '@/Components/Modal';

function CloseIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

export default function ConfirmDialog({ open, title, message, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
    // Uses neutral-* instead of gray-* on purpose: this project's tailwind.config.js
    // remaps gray to a bluish slate palette app-wide, but this dialog is styled to match
    // Claude.ai's own confirmation dialog, which reads as true neutral gray with no blue tint.
    return (
        <Modal
            show={!!open}
            onClose={onCancel}
            maxWidth="sm"
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
                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        autoFocus
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 ${
                            danger
                                ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500'
                                : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
