import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function EditUserModal({ user, show, onClose }) {
    const form = useForm({ name: '', email: '' });

    // Re-seed the form every time a different user is opened, since useForm's
    // initial state is only read once on mount and this modal instance is
    // reused across every row rather than remounted per-user.
    useEffect(() => {
        if (user) {
            form.setData({ name: user.name, email: user.email });
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const submit = (e) => {
        e.preventDefault();
        form.patch(route('admin.users.update', user.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">Edit {user?.name}</h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Changing the email will require the user to verify it again, and both the old and new address will be notified.
                </p>

                <div className="mt-4">
                    <InputLabel htmlFor="edit_user_name" value="Name" />
                    <TextInput
                        id="edit_user_name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        className="mt-1 block w-full"
                        required
                    />
                    <InputError message={form.errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="edit_user_email" value="Email" />
                    <TextInput
                        id="edit_user_email"
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        className="mt-1 block w-full"
                        required
                    />
                    <InputError message={form.errors.email} className="mt-2" />
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
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}
