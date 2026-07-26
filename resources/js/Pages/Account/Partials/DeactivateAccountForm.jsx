import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeactivateAccountForm({ className = '' }) {
    const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
    const passwordInput = useRef(null);

    const { data, setData, post, processing, reset, errors } = useForm({ password: '' });

    const confirmDeactivation = () => {
        setConfirmingDeactivation(true);
        setTimeout(() => passwordInput.current?.focus(), 250);
    };

    const deactivate = (e) => {
        e.preventDefault();
        post(route('account.deactivate'), {
            onSuccess: () => {
                setConfirmingDeactivation(false);
                reset();
            },
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingDeactivation(false);
        reset();
    };

    return (
        <section className={className}>

            <DangerButton className="mt-4" onClick={confirmDeactivation}>
                Deactivate Account
            </DangerButton>

            <Modal show={confirmingDeactivation} onClose={closeModal} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
                <form onSubmit={deactivate} className="p-6">
                    <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
                        Deactivate Account?
                    </h2>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-red-600 dark:text-red-400">
                        Your task submissions will be frozen until a manager decides to keep or reset them.
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                        Log in again at any time to reactivate your account.
                    </p>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" className="sr-only" />
                        <input
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            placeholder="Confirm your password"
                        />
                        <InputError message={errors.password} className="mt-2" />
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
                            Deactivate Account
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}