import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';

function ChevronIcon() {
    return (
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

/**
 * Styled replacement for a native <select> used as a list filter.
 * options: [{ value, label }]. Panel is capped to a scrollable ~15rem
 * (roughly 5-6 items) instead of a native OS listbox with no size control.
 */
export default function FilterSelect({ value, onChange, options, className = '', buttonClassName = '' }) {
    const selected = options.find((o) => String(o.value) === String(value)) ?? options[0];

    return (
        <Listbox value={value} onChange={onChange}>
            <div className={`relative ${className}`}>
                <ListboxButton
                    className={`flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-2 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 ${buttonClassName}`}
                >
                    <span className="truncate">{selected?.label ?? 'Select...'}</span>
                    <ChevronIcon />
                </ListboxButton>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full min-w-[11rem] overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
                        {options.map((opt) => (
                            <ListboxOption
                                key={opt.value}
                                value={opt.value}
                                className={({ focus }) =>
                                    `relative cursor-pointer select-none py-2 pl-9 pr-3 ${
                                        focus ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'
                                    }`
                                }
                            >
                                {({ selected: isSelected }) => (
                                    <>
                                        <span className={`block truncate ${isSelected ? 'font-medium' : ''}`}>{opt.label}</span>
                                        {isSelected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-indigo-600 dark:text-indigo-400">
                                                <CheckIcon />
                                            </span>
                                        )}
                                    </>
                                )}
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </Transition>
            </div>
        </Listbox>
    );
}
