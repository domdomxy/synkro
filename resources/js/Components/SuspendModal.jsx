import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { localDateTimeToIso } from '@/utils/datetime';
import useConfirm from '@/hooks/useConfirm';

const DURATION_OPTIONS = [
    { value: '1', label: '1 day' },
    { value: '3', label: '3 days' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: 'custom', label: 'Custom date...' },
    { value: 'permanent', label: 'Permanent' },
];

export default function SuspendModal({ user, show, onClose }) {
    const form = useForm({ duration: '7', custom_date: '', reason: '' });
    const { confirm, ConfirmDialog } = useConfirm();

    const submit = async (e) => {
        e.preventDefault();
        if (!(await confirm(form.data.duration === 'permanent' ? 'This will be permanent until manually lifted.' : 'They will not be able to log in until the suspension expires.', { title: `Suspend ${user?.name}?`, danger: true, confirmLabel: 'Suspend' }))) return;
        form.transform((data) => ({ ...data, custom_date: localDateTimeToIso(data.custom_date) }));
        form.post(route('admin.users.suspend', user.id), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg" overlayClassName="bg-black/55 backdrop-blur-[2px] dark:bg-black/70">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">Suspend {user?.name}?</h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">They won't be able to log in until the suspension is lifted or expires.</p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Duration</label>
                    <select
                        value={form.data.duration}
                        onChange={(e) => form.setData('duration', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>

                {form.data.duration === 'custom' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Suspended until</label>
                        <TextInput type="datetime-local" value={form.data.custom_date} onChange={(e) => form.setData('custom_date', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={form.errors.custom_date} className="mt-2" />
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-neutral-400">(shown to the user)</span>
                    </label>
                    <textarea
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        placeholder="e.g. Violation of community guidelines"
                    />
                    <InputError message={form.errors.reason} className="mt-1" />
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Suspend
                    </button>
                </div>
            </form>
            {ConfirmDialog}
        </Modal>
    );
}