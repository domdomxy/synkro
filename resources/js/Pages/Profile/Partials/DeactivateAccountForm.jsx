import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
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
        post(route('profile.deactivate'), {
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
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Deactivate Account</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Deactivating your account will log you out and freeze your active task submissions.
                    You can reactivate at any time by logging back in.
                </p>
            </header>

            <DangerButton className="mt-4" onClick={confirmDeactivation}>
                Deactivate Account
            </DangerButton>

            <Modal show={confirmingDeactivation} onClose={closeModal}>
                <form onSubmit={deactivate} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Deactivate your account?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Your task submissions will be frozen until a manager decides to keep or reset them.
                        Log in again at any time to reactivate your account.
                    </p>
                    <div className="mt-6">
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
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton disabled={processing}>Deactivate Account</DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}