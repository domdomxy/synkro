import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { Fragment, forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '@/Components/Avatar';

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
 * options: [{ value, label, disabled?, avatar?, badge? }]. Panel is capped to a
 * scrollable ~15rem (roughly 5-6 items) instead of a native OS listbox with
 * no size control. Pass disabled: true on an option to show but not allow
 * picking it (e.g. a stale/former value kept only so its label still
 * renders). Pass avatar: <user-like object with name/avatar_path> on an
 * option (e.g. a project member or "All Users" entry) to show that user's
 * picture/initials next to the label, both in the closed button and in the
 * open list. Pass badge: { label, className } to show a small rounded pill
 * (e.g. a role) between the avatar and the label - className supplies its
 * background/text color, same shape as the roleStyles map.
 */
export default function FilterSelect({ id, value, onChange, options, className = '', buttonClassName = '' }) {
    const selected = options.find((o) => String(o.value) === String(value)) ?? options[0];
    const anchorRef = useRef(null);

    return (
        <Listbox value={value} onChange={onChange}>
            {({ open }) => (
                <div className={`relative ${className}`} ref={anchorRef}>
                    <ListboxButton
                        id={id}
                        className={`flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-2 pl-3 pr-2 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 ${buttonClassName}`}
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            {selected?.avatar && <Avatar user={selected.avatar} size="h-5 w-5" rounded="rounded-full" className="shrink-0" />}
                            {selected?.badge && (
                                <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs capitalize ${selected.badge.className}`}>
                                    {selected.badge.label}
                                </span>
                            )}
                            <span className="truncate">{selected?.label ?? 'Select...'}</span>
                        </span>
                        <ChevronIcon />
                    </ListboxButton>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <ClampedOptions open={open} anchorRef={anchorRef}>
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
                                            <span className="flex min-w-0 items-center gap-2">
                                                {opt.avatar && <Avatar user={opt.avatar} size="h-5 w-5" rounded="rounded-full" className="shrink-0" />}
                                                {opt.badge && (
                                                    <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs capitalize ${opt.badge.className}`}>
                                                        {opt.badge.label}
                                                    </span>
                                                )}
                                                <span className={`block truncate ${isSelected ? 'font-medium' : ''}`}>{opt.label}</span>
                                            </span>
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

// The options list used to render as an `absolute`-positioned child right
// next to its trigger. That works fine standalone, but Dropdown.Content
// (the "Filters" button's panel, for one) wraps its children in an
// `overflow-hidden` div to clip rounded corners on normal menu items - and
// that same overflow-hidden clips this nested popup too, cutting its list
// short instead of letting it float over the rest of the page. Same class
// of bug as the dropdown-clipping issues fixed elsewhere (see synkro notes
// on transform/overflow-hidden ancestors breaking position:fixed/absolute
// children) - fixed here by portaling straight to document.body and
// positioning with `fixed` from the trigger's own measured rect, so no
// ancestor's overflow or stacking context can clip it.
//
// Portaling to document.body also means this can end up as a `fixed`
// sibling of Modal's own Dialog wrapper (z-[60]) when a FilterSelect is
// used inside a modal (e.g. SuspendModal's duration picker) - two `fixed`
// elements at the body level stack purely by z-index, not DOM order, so
// without a higher z-index here the modal painted on top and the open
// options list was invisible behind it even though it had opened. z-[70]
// keeps this above Modal/AdminGuideDrawer/ToastLayer (all z-[60]) while
// staying below full-screen overlays like ImageLightbox and the drag ghost
// (z-[100]), which never need to coexist with an open dropdown anyway.
//
// Wrapped in forwardRef because it sits directly inside <Transition
// as={Fragment}>, which attaches a ref straight to its child to track the
// DOM node for the transition - a plain function component can't receive
// that ref.
const ClampedOptions = forwardRef(function ClampedOptions({ open, anchorRef, children }, forwardedRef) {
    const [rect, setRect] = useState(null);
    const localRef = useRef(null);

    useLayoutEffect(() => {
        // Only measure/track while open. On close, deliberately leave the
        // last measured rect in place rather than clearing it: the panel
        // stays mounted during Headless UI's leave/fade-out transition, so
        // resetting position here would flash it at the fallback (0,0)
        // top-left corner for that split second before it fully unmounts.
        if (!open || !anchorRef.current) return;

        const recalc = () => setRect(anchorRef.current?.getBoundingClientRect() ?? null);
        recalc();

        window.addEventListener('resize', recalc);
        window.addEventListener('scroll', recalc, true);
        return () => {
            window.removeEventListener('resize', recalc);
            window.removeEventListener('scroll', recalc, true);
        };
    }, [open, anchorRef]);

    const setRefs = (node) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') {
            forwardedRef(node);
        } else if (forwardedRef) {
            forwardedRef.current = node;
        }
    };

    // ListboxOptions must always render here (never conditionally omitted)
    // so Headless UI's own open/closed state - not ours - controls its
    // presence; Transition tracks a stable ref to this node across
    // open/close, and a component that sometimes returns null breaks that.
    const r = rect ?? { top: 0, bottom: 0, left: 0, right: 0, width: 0 };
    const margin = 8;
    const minWidth = 176; // matches the old min-w-[11rem]
    const width = Math.max(r.width, minWidth);

    // Right-aligned to the trigger, same as the old `absolute right-0`,
    // then nudged back on screen if that would run off either edge.
    let left = r.right - width;
    left = Math.min(left, window.innerWidth - margin - width);
    left = Math.max(left, margin);

    return createPortal(
        <ListboxOptions
            ref={setRefs}
            data-filter-select-portal
            style={{ position: 'fixed', top: r.bottom + 4, left, width }}
            className="z-[70] max-h-60 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
        >
            {children}
        </ListboxOptions>,
        document.body
    );
});
