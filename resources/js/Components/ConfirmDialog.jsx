import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ConfirmDialog({ open, title, message, danger, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
    const ConfirmButton = danger ? DangerButton : PrimaryButton;

    return (
        <Modal show={!!open} onClose={onCancel} maxWidth="sm">
            <div className="p-6">
                {title && <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>}
                <p className={`text-sm text-gray-600 dark:text-gray-400 ${title ? 'mt-2' : ''}`}>{message}</p>
                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
                    <ConfirmButton onClick={onConfirm} autoFocus>{confirmLabel}</ConfirmButton>
                </div>
            </div>
        </Modal>
    );
}
