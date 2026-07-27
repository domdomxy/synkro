import { forwardRef, useEffect, useRef } from 'react';

// A <textarea> that grows to fit its content instead of scrolling internally.
// Height is recalculated whenever `value` changes, so it also shrinks back
// down when text is deleted or the field is reset.
//
// Wrapped in forwardRef so callers that need direct DOM access (e.g. to read
// cursor position or refocus the field, like MentionTextarea does for @mention
// autocomplete) can grab the underlying <textarea> while still getting the
// autogrow behavior for free.
const AutoGrowTextarea = forwardRef(function AutoGrowTextarea({ value, className = '', ...props }, forwardedRef) {
    const innerRef = useRef(null);

    useEffect(() => {
        const el = innerRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={(node) => {
                innerRef.current = node;
                if (typeof forwardedRef === 'function') forwardedRef(node);
                else if (forwardedRef) forwardedRef.current = node;
            }}
            value={value}
            rows={1}
            className={`resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
});

export default AutoGrowTextarea;
