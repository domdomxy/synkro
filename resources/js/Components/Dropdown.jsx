import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import useViewportClamp from '@/hooks/useViewportClamp';

// Exported so nested content (e.g. AccountMenu) can close the dropdown itself
// on a real navigation/action, instead of the whole content panel closing on
// any click inside it (which used to swallow clicks on the theme buttons).
export const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    // Shared with Content so align="auto" can measure where the trigger
    // actually sits before deciding which side to open toward.
    const triggerRef = useRef(null);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    // Closes on any click outside the trigger/panel. A ref-based check is used
    // instead of a full-screen click-catching overlay: the overlay approach
    // gets trapped inside whatever stacking context it's nested in (e.g. the
    // sticky nav's own z-index), so it can silently fail to catch clicks
    // elsewhere on the page. This works regardless of DOM position, and lets
    // a click on another nav item both close the dropdown and still activate
    // that item, instead of requiring a first click just to dismiss it.
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen, triggerRef }}>
            <div className="relative" ref={rootRef}>{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { toggleOpen, triggerRef } = useContext(DropDownContext);

    return <div ref={triggerRef} onClick={toggleOpen}>{children}</div>;
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white dark:bg-gray-700',
    children,
}) => {
    const { open, triggerRef } = useContext(DropDownContext);

    // align="auto" picks the side with more room instead of a side that's
    // fixed regardless of where the trigger happens to sit — a trigger
    // living in the right half of a toolbar (e.g. a "Filters" button) opens
    // toward the left, one in the left half opens toward the right. Falls
    // back to "left" until the trigger's position has been measured.
    const [autoAlign, setAutoAlign] = useState('left');
    useLayoutEffect(() => {
        if (align !== 'auto' || !open) return;
        const trigger = triggerRef?.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const triggerCenter = rect.left + rect.width / 2;
        setAutoAlign(triggerCenter > window.innerWidth / 2 ? 'right' : 'left');
    }, [open, align, triggerRef]);

    const resolvedAlign = align === 'auto' ? autoAlign : align;

    // Anchor classes below set a sensible default side; this then nudges the
    // panel back on screen with a transform if that default still runs off
    // either edge for the trigger's actual position/viewport width (see
    // useViewportClamp for why a same/flip-side anchor alone isn't enough).
    const { ref: panelRef, style: clampStyle } = useViewportClamp(open);

    let alignmentClasses = 'origin-top';

    if (resolvedAlign === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (resolvedAlign === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    } else if (width === '56') {
        widthClasses = 'w-56';
    } else if (width === '72') {
        widthClasses = 'w-72';
    }

    return (
        <>
            <Transition
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div
                    ref={panelRef}
                    style={clampStyle}
                    className={`absolute z-50 mt-2 rounded-xl shadow-xl ${alignmentClasses} ${widthClasses}`}
                >
                    <div
                        className={
                            `rounded-xl ring-1 ring-black ring-opacity-5 dark:ring-white/10 ` +
                            contentClasses
                        }
                    >
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;