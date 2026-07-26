import Modal from '@/Components/Modal';
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
        <Modal show={show} onClose={onClose} maxWidth="sm" overlayClassName="bg-black/55 backdrop-blur-[2px] dark:bg-black/70">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Lift {user?.name}'s Suspension?</h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">They'll be able to log in again right away.</p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-neutral-400">(included in the email sent to them)</span>
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

                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing || !form.data.reason.trim()}
                        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Lift Suspension
                    </button>
                </div>
            </form>
        </Modal>
    );
}
