import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { localDateTimeToIso } from '@/utils/datetime';

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

    const submit = (e) => {
        e.preventDefault();
        if (!confirm(`Suspend ${user?.name}? ${form.data.duration === 'permanent' ? 'This will be permanent until manually lifted.' : ''}`)) return;
        form
            .transform((data) => ({ ...data, custom_date: localDateTimeToIso(data.custom_date) }))
            .post(route('admin.users.suspend', user.id), {
                onSuccess: () => { form.reset(); onClose(); },
            });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Suspend {user?.name}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">They won't be able to log in until the suspension is lifted or expires.</p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Suspended until</label>
                        <TextInput type="datetime-local" value={form.data.custom_date} onChange={(e) => form.setData('custom_date', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={form.errors.custom_date} className="mt-2" />
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason <span className="text-red-500">*</span> <span className="font-normal text-gray-400">(shown to the user)</span>
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

                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton disabled={form.processing}>Suspend</DangerButton>
                </div>
            </form>
        </Modal>
    );
}