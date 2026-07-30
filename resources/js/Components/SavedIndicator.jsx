import { Transition } from '@headlessui/react';

/**
 * Small "Saved" confirmation shown next to a form's submit button, replacing
 * plain "Saved." text with a checkmark for a bit more visual confirmation.
 * Used across the Account forms (and anywhere else a useForm's
 * `recentlySuccessful` flag needs a quick acknowledgement).
 */
export default function SavedIndicator({ show, label = 'Saved' }) {
    return (
        <Transition
            show={show}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
        >
            <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {label}
            </span>
        </Transition>
    );
}
