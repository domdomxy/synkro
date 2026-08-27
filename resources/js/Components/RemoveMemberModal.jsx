import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';

export default function RemoveMemberModal({ project, member, show, onClose }) {
    const form = useForm({ reason: '' });

    const close = () => {
        form.reset();
        onClose();
    };

    const submit = (e) => {
        e.preventDefault();
        form.delete(route('projects.members.destroy', [project.id, member.id]), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    return (
        <Modal show={show} onClose={close} maxWidth="sm" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={submit} className="p-5">
                <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">Remove {member?.name}?</h2>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    They'll lose access to this project immediately. Their in-progress work is frozen for review, not deleted.
                </p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-neutral-400">(included in the email sent to them)</span>
                    </label>
                    <textarea
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        placeholder="e.g. Inactive on this project for over two months."
                    />
                    <InputError message={form.errors.reason} className="mt-1" />
                </div>

                {/* Reversed on purpose: Cancel sits in the usual confirm slot and wears the
                    colored style, while the real action is neutral. Breaks the reflex of
                    clicking the colored/rightmost button without reading the dialog. */}
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        {form.processing && <Spinner className="mr-2 h-4 w-4" />}
                        Remove Member
                    </button>
                    <button
                        type="button"
                        onClick={close}
                        autoFocus
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
}
