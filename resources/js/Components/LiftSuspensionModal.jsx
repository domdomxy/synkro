import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function LiftSuspensionModal({ user, show, onClose }) {
    const form = useForm({ reason: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('admin.users.lift-suspension', user.id), {
            preserveScroll: true,
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Lift {user?.name}'s Suspension</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">They'll be able to log in again right away.</p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-gray-400">(included in the email sent to them)</span>
                    </label>
                    <textarea
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        placeholder="e.g. Thanks for reaching out, we've reviewed your account and lifted the suspension."
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <InputError message={form.errors.reason} className="mt-2" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={form.processing || !form.data.reason.trim()}>Lift Suspension</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
