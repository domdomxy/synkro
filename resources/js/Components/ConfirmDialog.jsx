import Modal from '@/Components/Modal';

export default function ConfirmDialog({ open, title, message, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
    // Uses neutral-* instead of gray-* on purpose: this project's tailwind.config.js
    // remaps gray to a bluish slate palette app-wide, but this dialog is styled to match
    // Claude.ai's own confirmation dialog, which reads as true neutral gray with no blue tint.
    return (
        <Modal show={!!open} onClose={onCancel} maxWidth="sm" overlayClassName="bg-white/70 backdrop-blur-2xl dark:bg-neutral-950/70 dark:backdrop-blur-2xl">
            <div className="p-6">
                {title && <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>}
                <p className={`text-sm text-neutral-500 dark:text-neutral-400 ${title ? 'mt-2' : ''}`}>{message}</p>
                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        autoFocus
                        className={`rounded-full px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 ${
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
