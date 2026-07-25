import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ConfirmDialog({ open, title, message, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
    const ConfirmButton = danger ? DangerButton : PrimaryButton;

    return (
        <Modal show={!!open} onClose={onCancel} maxWidth="sm" overlayClassName="bg-black/20 backdrop-blur-[2px] dark:bg-black/40">
            <div className="p-6">
                <div className="flex items-start gap-3.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'}`}>
                        {danger ? (
                            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17h.008v.008H12V17z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                            </svg>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                        {title && <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>}
                        <p className={`text-sm text-gray-600 dark:text-gray-400 ${title ? 'mt-1' : ''}`}>{message}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
                    <ConfirmButton onClick={onConfirm} autoFocus>{confirmLabel}</ConfirmButton>
                </div>
            </div>
        </Modal>
    );
}
