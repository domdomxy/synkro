import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '', deletionRequestedAt = null }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const cancelForm = useForm({});

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('account.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const cancelDeletion = () => {
        cancelForm.post(route('account.destroy.cancel'), {
            preserveScroll: true,
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    if (deletionRequestedAt) {
        return (
            <section className={`space-y-4 ${className}`}>
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            Deletion pending confirmation
                        </p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                            We've emailed you a link to confirm permanently deleting your account. Your account
                            stays exactly as it is unless you click that link.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={cancelDeletion}
                    disabled={cancelForm.processing}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                    Cancel Deletion Request
                </button>
            </section>
        );
    }

    return (
        <section className={`space-y-6 ${className}`}>
            <DangerButton onClick={confirmUserDeletion}>
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                        Delete Account?
                    </h2>

                    <p className="mt-2.5 text-[15px] leading-relaxed text-red-600 dark:text-red-400">
                        Once your account is deleted, all of its resources and data will be permanently deleted.
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                        Enter your password to send a confirmation link to your email. Your account is only
                        deleted after you click that link.
                    </p>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
                        >
                            Send Confirmation Email
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
