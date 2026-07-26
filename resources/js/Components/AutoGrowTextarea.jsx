import { useEffect, useRef } from 'react';

// A <textarea> that grows to fit its content instead of scrolling internally.
// Height is recalculated whenever `value` changes, so it also shrinks back
// down when text is deleted or the field is reset.
export default function AutoGrowTextarea({ value, className = '', ...props }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value}
            rows={1}
            className={`resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
}
