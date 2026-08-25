import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import EmailValidityHint from '@/Components/EmailValidityHint';
import Spinner from '@/Components/Spinner';
import { isValidEmail } from '@/utils/email';
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

        if (!isValidEmail(form.data.email)) {
            form.setError('email', 'Please enter a valid email address.');
            return;
        }

        form.patch(route('admin.users.update', user.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={submit} className="p-5">
                <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">Edit {user?.name}</h2>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
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
                    <EmailValidityHint value={form.data.email} onChange={(value) => form.setData('email', value)} />
                    <InputError message={form.errors.email} className="mt-2" />
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
                    >
                        {form.processing && <Spinner className="mr-2 h-4 w-4" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}
