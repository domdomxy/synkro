import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PasswordInput from '@/Components/PasswordInput';
import Spinner from '@/Components/Spinner';
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
                <form onSubmit={deactivate} className="p-5">
                    <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100">
                        Deactivate Account?
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-red-600 dark:text-red-400">
                        Your task submissions will be frozen until a manager decides to keep or reset them.
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                        Log in again at any time to reactivate your account.
                    </p>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" className="sr-only" />
                        <PasswordInput
                            id="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 w-full"
                            placeholder="Confirm your password"
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>
                    {/* Reversed on purpose: Cancel sits in the usual confirm slot and wears the
                        colored style, while the real action is neutral. Breaks the reflex of
                        clicking the colored/rightmost button without reading the dialog. */}
                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                        >
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Deactivate Account
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            autoFocus
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}