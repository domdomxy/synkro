import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import useViewportClamp from '@/hooks/useViewportClamp';

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
 * options: [{ value, label, disabled? }]. Panel is capped to a scrollable
 * ~15rem (roughly 5-6 items) instead of a native OS listbox with no size
 * control. Pass disabled: true on an option to show but not allow picking it
 * (e.g. a stale/former value kept only so its label still renders).
 */
export default function FilterSelect({ id, value, onChange, options, className = '', buttonClassName = '' }) {
    const selected = options.find((o) => String(o.value) === String(value)) ?? options[0];

    return (
        <Listbox value={value} onChange={onChange}>
            {({ open }) => (
                <div className={`relative ${className}`}>
                    <ListboxButton
                        id={id}
                        className={`flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-2 pl-3 pr-2 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 ${buttonClassName}`}
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
                        <ClampedOptions open={open}>
                            {options.map((opt) => (
                                <ListboxOption
                                    key={opt.value}
                                    value={opt.value}
                                    disabled={opt.disabled}
                                    className={({ focus, disabled }) =>
                                        `relative select-none py-2 pl-9 pr-3 ${
                                            disabled
                                                ? 'cursor-not-allowed text-gray-400 dark:text-gray-600'
                                                : `cursor-pointer ${focus ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`
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
                        </ClampedOptions>
                    </Transition>
                </div>
            )}
        </Listbox>
    );
}

// min-w-[11rem] below means, for a narrow trigger (e.g. inside a compact
// filter panel), the options list can be wider than the trigger it's
// anchored to and run past the right edge of the screen — the same class of
// bug as the "Filters" panel itself. useViewportClamp nudges it back on
// screen the same way, kept in its own component so the hook has a proper
// place to live (Listbox's children-as-function callback isn't a valid spot
// to call a hook from directly).
function ClampedOptions({ open, children }) {
    const { ref, style } = useViewportClamp(open);

    return (
        <ListboxOptions
            ref={ref}
            style={style}
            className="absolute z-20 mt-1 max-h-60 w-full min-w-[11rem] overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
        >
            {children}
        </ListboxOptions>
    );
}
