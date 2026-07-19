import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function RemoveMemberModal({ project, member, show, onClose }) {
    const form = useForm({ reason: '' });

    const submit = (e) => {
        e.preventDefault();
        if (!confirm(`Remove ${member?.name} from this project?`)) return;
        form.delete(route('projects.members.destroy', [project.id, member.id]), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Remove {member?.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    They'll lose access to this project immediately. Their in-progress work is frozen for review, not deleted.
                </p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-gray-400">(included in the email sent to them)</span>
                    </label>
                    <textarea
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        placeholder="e.g. Inactive on this project for over two months."
                    />
                    <InputError message={form.errors.reason} className="mt-1" />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton disabled={form.processing}>Remove Member</DangerButton>
                </div>
            </form>
        </Modal>
    );
}
