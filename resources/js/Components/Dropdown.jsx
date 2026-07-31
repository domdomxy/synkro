import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Exported so nested content (e.g. AccountMenu) can close the dropdown itself
// on a real navigation/action, instead of the whole content panel closing on
// any click inside it (which used to swallow clicks on the theme buttons).
export const DropDownContext = createContext();

const Dropdown = ({ children }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

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
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative" ref={rootRef}>{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { toggleOpen } = useContext(DropDownContext);

    return <div onClick={toggleOpen}>{children}</div>;
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white dark:bg-gray-700',
    children,
}) => {
    const { open } = useContext(DropDownContext);

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
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