import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const TEXT_COLORS = ['#111827', '#ffffff', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777'];
const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff'];
const FONT_SIZES = [
    { label: 'Small', px: '12px' },
    { label: 'Normal', px: '14px' },
    { label: 'Large', px: '18px' },
    { label: 'X-Large', px: '24px' },
];

function ToolbarButton({ active, onClick, title, children }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            title={title}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition sm:h-8 sm:w-8 ${
                active
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="mx-1 h-6 w-px shrink-0 self-center bg-gray-300 dark:bg-gray-600 sm:h-5" />;
}

function ColorSwatch({ color, onClick, onRemove, title }) {
    return (
        <div className="group relative">
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClick}
                title={title ?? color}
                className="h-7 w-7 rounded-full border border-gray-200 transition hover:scale-110 dark:border-gray-600 sm:h-6 sm:w-6"
                style={{ backgroundColor: color }}
            />
            {onRemove && (
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    title="Remove from list"
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[9px] leading-none text-white hover:bg-gray-900 group-hover:flex dark:bg-gray-300 dark:text-gray-800 dark:hover:bg-white sm:h-3.5 sm:w-3.5 [@media(hover:none)]:flex"
                >
                    &times;
                </button>
            )}
        </div>
    );
}

function Popover({ trigger, children, open, onToggle, onClose, width = 'auto', leadingButton }) {
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Rough initial placement right above the toolbar button; the layout effect below
    // corrects it once the portal content has real dimensions to measure against.
    const handleToggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.top, left: rect.left });
        }
        onToggle();
    };

    useLayoutEffect(() => {
        if (!open || !menuRef.current || !btnRef.current) return;
        const menuRect = menuRef.current.getBoundingClientRect();
        const btnRect = btnRef.current.getBoundingClientRect();
        const spaceAbove = btnRect.top;
        // Prefer opening upward (matches the old bottom-full look); fall back to opening
        // downward if there isn't enough room above the viewport top.
        const top = spaceAbove > menuRect.height + 12 ? btnRect.top - menuRect.height - 8 : btnRect.bottom + 8;
        const clampedTop = Math.min(Math.max(8, top), window.innerHeight - menuRect.height - 8);
        const left = Math.min(Math.max(8, btnRect.left), window.innerWidth - menuRect.width - 8);
        setCoords({ top: clampedTop, left });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) onClose();
        };
        // Closing on scroll/resize is simpler and more reliable than re-tracking position mid-scroll.
        const handleScrollOrResize = () => onClose();
        document.addEventListener('mousedown', handleOutside);
        // Touch browsers don't reliably fire mousedown for outside taps, so this is handled
        // separately rather than relying on the synthetic mouse events some mobile browsers emit.
        document.addEventListener('touchstart', handleOutside, { passive: true });
        // Arm the scroll/resize listeners a tick after opening rather than immediately. Some
        // popovers (the link one) autofocus a real input the instant they mount, and focusing
        // something can itself trigger a same-frame scroll of an ancestor container - which, if
        // this listener were live already, closed the popover the same moment it opened. A short
        // delay skips that self-inflicted opening scroll while still closing on any scroll a
        // person actually causes afterward.
        const armTimer = setTimeout(() => {
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
        }, 150);
        return () => {
            clearTimeout(armTimer);
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [open, onClose]);

    return (
        <div className={`relative flex shrink-0 items-stretch ${leadingButton ? 'overflow-hidden rounded-md' : ''}`}>
            {leadingButton}
            {leadingButton && <div className="w-px shrink-0 self-stretch bg-gray-300 dark:bg-gray-600" />}
            <button
                ref={btnRef}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleToggle}
                className="flex h-9 items-center gap-1 rounded-md px-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 sm:h-8"
            >
                {trigger}
            </button>
            {/* Portals to document.body, so inside a Modal this ends up a `fixed` sibling of
                Modal's own Dialog wrapper (z-[60]) - two `fixed` elements at the body level stack
                by z-index alone, not DOM order, so without a higher z-index here the modal painted
                on top and every dropdown/popover in this toolbar (list type, font size, colors,
                insert-link, the tip) was invisible behind it despite being open. z-[70] matches the
                convention FilterSelect.jsx already established for this exact situation. */}
            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width }}
                    className="z-[70] rounded-lg bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    {children}
                </div>,
                document.body
            )}
        </div>
    );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...', rows = 4, maxHeight = '16rem' }) {
    const editorRef = useRef(null);
    const isFirstRender = useRef(true);
    const [savedRange, setSavedRange] = useState(null);
    const [openPopover, setOpenPopover] = useState(null); // 'color' | 'highlight' | 'size' | 'tip' | null
    const [activeStates, setActiveStates] = useState({ bold: false, italic: false, underline: false, highlight: false, list: null });
    const [customColor, setCustomColor] = useState('#111827');
    const [customHighlight, setCustomHighlight] = useState('#fef08a');
    const [lastHighlightColor, setLastHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
    const [customTextColors, setCustomTextColors] = useState([]);
    const [customHighlightColors, setCustomHighlightColors] = useState([]);
    const [customSize, setCustomSize] = useState('');
    const [customFontSizes, setCustomFontSizes] = useState([]);
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const linkUrlInputRef = useRef(null);

    // Runs instead of a plain `autoFocus` on the URL input. Plain autoFocus calls .focus() with
    // no options, and if the popover renders anywhere the browser considers "off view" (common
    // for a `position: fixed` portal near the edge of a scrollable settings panel), the browser
    // scrolls that ancestor to bring the newly-focused input into view. That scroll fires on the
    // very frame the popover opens and got picked up by Popover's own scroll-to-close listener
    // below, closing the popover before it had even finished appearing. `preventScroll: true`
    // stops the browser from doing that scroll in the first place.
    useEffect(() => {
        if (openPopover === 'link') linkUrlInputRef.current?.focus({ preventScroll: true });
    }, [openPopover]);

    useEffect(() => {
        if (isFirstRender.current && editorRef.current) {
            editorRef.current.innerHTML = value || '';
            isFirstRender.current = false;
        }
    }, [value]);

    // Without this, execCommand('foreColor', ...) emits legacy <font color="..."> tags in most
    // browsers instead of <span style="color:...">. Backend sanitization only allow-lists <span>
    // (not <font>), so text colors were being silently stripped on save. Forcing CSS-based markup
    // here makes every formatting command (foreColor, hiliteColor, bold, etc.) emit inline styles
    // on tags that are actually in the server's allow-list.
    useEffect(() => {
        document.execCommand('styleWithCSS', false, true);
        // Same reasoning, for line breaks: without this, most browsers wrap each Enter press in a
        // <div> (Chrome/Edge) - which the backend's strip_tags allow-list doesn't include, since it
        // only allows <br>/<p> for block content. That was silently deleting every line break on
        // save (strip_tags removes disallowed tags but doesn't replace them with anything), making
        // multi-line descriptions collapse into one run-on line. Forcing <br> for Enter keeps output
        // consistent across browsers and inside the server's existing allow-list.
        document.execCommand('defaultParagraphSeparator', false, 'br');
    }, []);

    const updateActiveStates = useCallback(() => {
        try {
            const hiliteValue = document.queryCommandValue('hiliteColor');
            setActiveStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                highlight: !!hiliteValue && !['transparent', 'rgba(0, 0, 0, 0)', ''].includes(hiliteValue),
                // Only one of the two list commands can be active at once (a cursor is either inside
                // a <ul> or an <ol>, never both), so this collapses to a single 'ul' | 'ol' | null.
                list: document.queryCommandState('insertUnorderedList')
                    ? 'ul'
                    : document.queryCommandState('insertOrderedList')
                        ? 'ol'
                        : null,
            });
        } catch {
            // queryCommandState/queryCommandValue can throw outside a focused editable context; ignore
        }
    }, []);

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
            setSavedRange(sel.getRangeAt(0).cloneRange());
        }
        updateActiveStates();
    };

    const restoreSelection = () => {
        if (!savedRange) return false;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
        return true;
    };

    // Re-adding the *same* saved Range on every single toolbar click (which is what unconditionally
    // calling restoreSelection() used to do) resets the browser's internal "pending typing style"
    // tracking each time. That's harmless for a single toggle, but it's exactly why clicking Bold
    // then Italic on an empty/collapsed cursor used to leave only the second one active - the second
    // restoreSelection() call wiped out the first command's pending state. Only recreate the Range
    // when the live selection has actually left the editor (e.g. after focusing a popover input).
    const ensureSelection = () => {
        const sel = window.getSelection();
        const stillInEditor = sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode);
        if (stillInEditor) return true;
        if (restoreSelection()) return true;

        // Neither a live selection nor a saved one to fall back to - this is the very first
        // toolbar click on a description that's never been clicked into yet (a brand-new "New
        // Project"/"New Task" form, exactly like the empty state in the screenshot). Calling
        // .focus() on a contentEditable doesn't drop a caret into it by itself in most browsers,
        // so without an actual Range/Selection, execCommand has nothing to act on and every
        // button silently no-ops - looks and feels completely dead. Planting a collapsed caret at
        // the end of whatever's already there (the very start, for an empty editor) gives every
        // toolbar action somewhere real to apply itself from the first click onward.
        if (!editorRef.current) return false;
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        setSavedRange(range.cloneRange());
        return true;
    };

    const exec = (command, arg = null) => {
        // Restore/plant the Range *before* focusing. Calling .focus() on a contentEditable that
        // doesn't already hold a live Range makes most browsers default the caret to the very
        // start of the content - so doing this the other way round (as it used to be) silently
        // discarded wherever the cursor actually was every time real DOM focus had moved away
        // (e.g. after typing in a popover's own input field) and replayed the command at position
        // zero instead.
        ensureSelection();
        editorRef.current.focus();
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, arg);
        onChange(editorRef.current.innerHTML);
        updateActiveStates();
    };

    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return `rgb(${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255})`;
    };

    // execCommand('hiliteColor', ..., 'transparent') wraps the selection in a *new* span rather than
    // touching whatever highlight span is already there. A transparent child doesn't paint over an
    // ancestor's background, so the old color just kept showing through underneath. Clearing the
    // inline background-color directly off every touched element removes it for real.
    const stripHighlightInRange = (range) => {
        if (!editorRef.current) return;
        const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (el) => (el.style?.backgroundColor && range.intersectsNode(el) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
        });
        const touched = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) touched.push(node);
        touched.forEach((el) => {
            el.style.backgroundColor = '';
            if (!el.getAttribute('style')) el.removeAttribute('style');
        });
    };

    const toggleHighlight = (color) => {
        // See exec() above: restore the Range before focusing, not after.
        ensureSelection();
        editorRef.current.focus();
        document.execCommand('styleWithCSS', false, true);
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const node = selection.anchorNode?.parentElement;
            const current = node ? window.getComputedStyle(node).backgroundColor : null;
            if (current === hexToRgb(color)) {
                stripHighlightInRange(selection.getRangeAt(0));
                document.execCommand('hiliteColor', false, 'transparent');
                onChange(editorRef.current.innerHTML);
                updateActiveStates();
                setOpenPopover(null);
                return;
            }
        }
        document.execCommand('hiliteColor', false, color);
        onChange(editorRef.current.innerHTML);
        setLastHighlightColor(color);
        updateActiveStates();
        setOpenPopover(null);
    };

    // For a collapsed cursor (no selection) sitting inside an already-highlighted span,
    // execCommand('hiliteColor', 'transparent') only sets the browser's internal "next
    // character" typing style - it doesn't move the caret out of that span. The next
    // character typed then lands nested inside it, and a transparent background on that
    // nested text doesn't actually hide the ancestor's highlight (same underlying issue
    // stripHighlightInRange above works around for selections, just with nothing to select
    // here). This physically splits the highlighted element at the caret and drops a plain,
    // un-highlighted marker span between the two true-sibling halves, so typing afterward
    // has genuinely left the highlighted element instead of merely being told to look clear
    // while still inside it.
    const escapeHighlightAtCursor = () => {
        const selection = window.getSelection();
        if (!selection.rangeCount || !selection.isCollapsed || !editorRef.current) return;
        const range = selection.getRangeAt(0);

        let highlighted = null;
        let el = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
        while (el && el !== editorRef.current) {
            if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') {
                highlighted = el;
                break;
            }
            el = el.parentElement;
        }
        // Nothing highlighted around the caret to escape - execCommand's own typing-state
        // handling is already correct in that case.
        if (!highlighted) return;

        // Everything from the caret to the end of the highlighted element becomes the
        // "after" half, extracted out so it can be re-wrapped in its own copy of the
        // highlighted element once the marker is in place between the two halves.
        const afterRange = document.createRange();
        afterRange.setStart(range.startContainer, range.startOffset);
        afterRange.setEndAfter(highlighted.lastChild ?? highlighted);
        const afterFragment = afterRange.extractContents();

        const marker = document.createElement('span');
        marker.style.backgroundColor = 'transparent';
        // A real (non-empty) text node gives the caret something concrete to sit inside;
        // an empty span gets silently merged away by the browser's own editing commands on
        // the very next keystroke, undoing the escape before it's even used.
        marker.appendChild(document.createTextNode(ZWSP));
        highlighted.after(marker);

        if (afterFragment.hasChildNodes()) {
            const afterSpan = highlighted.cloneNode(false);
            afterSpan.appendChild(afterFragment);
            marker.after(afterSpan);
        }

        // The caret was at the very start of the highlighted element's content (nothing left
        // in the "before" half) - it's now an empty span sitting to the left of the marker
        // with nothing in it, so drop it instead of leaving a stray empty tag behind.
        if (!highlighted.hasChildNodes()) highlighted.remove();

        const newRange = document.createRange();
        newRange.setStart(marker.firstChild, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        setSavedRange(newRange.cloneRange());
    };

    const clearHighlight = () => {
        // See exec() above: restore the Range before focusing, not after.
        ensureSelection();
        editorRef.current.focus();
        document.execCommand('styleWithCSS', false, true);
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            stripHighlightInRange(selection.getRangeAt(0));
            document.execCommand('hiliteColor', false, 'transparent');
        } else {
            document.execCommand('hiliteColor', false, 'transparent');
            escapeHighlightAtCursor();
        }
        onChange(editorRef.current.innerHTML);
        updateActiveStates();
        setOpenPopover(null);
    };

    const applyHighlight = (color) => { exec('hiliteColor', color); setLastHighlightColor(color); setOpenPopover(null); };

    // One-click highlight on/off at the cursor, so the person doesn't have to select already-typed
    // text and open the popover just to turn highlighting off again. Works both on a selection
    // (wraps it) and on a collapsed cursor (sets the "typing state" for whatever's typed next),
    // because execCommand('hiliteColor', ...) supports both natively.
    const toggleHighlightAtCursor = () => {
        if (activeStates.highlight) {
            clearHighlight();
        } else {
            exec('hiliteColor', lastHighlightColor);
        }
    };

    // Toggling the *same* list type off falls back to insertUnorderedList/insertOrderedList's native
    // toggle behavior (browsers un-wrap the <li>s back to plain lines when the command matching the
    // current list type is re-run). Switching from one type to the other (e.g. bulleted -> numbered)
    // just re-runs the new command, which browsers natively convert in place rather than nesting.
    const applyList = (type) => {
        exec(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
        setOpenPopover(null);
    };

    const indentList = () => { exec('indent'); setOpenPopover(null); };
    const outdentList = () => { exec('outdent'); setOpenPopover(null); };

    const applyTextColor = (color) => { exec('foreColor', color); setOpenPopover(null); };

    // "Default" isn't one of the fixed swatches - it clears any explicit color back to the theme's
    // normal text color instead of picking a new fixed one. execCommand('foreColor', ..., 'inherit')
    // (with styleWithCSS forced on above) wraps the selection in `<span style="color: inherit;">`,
    // which then follows whatever text color is active wherever the content is rendered - including
    // switching automatically between light/dark/black themes, rather than baking in a fixed hex
    // that can go unreadable after a theme switch (see utils/richTextColor.js for the equivalent fix
    // applied to already-saved fixed colors when rendering them elsewhere in the app).
    const applyDefaultTextColor = () => { exec('foreColor', 'inherit'); setOpenPopover(null); };

    // Prefills the Label field with whatever's currently selected (so selecting a phrase
    // and then adding a link keeps that phrase as the label instead of starting blank),
    // and clears the URL field for a fresh entry each time the popover opens.
    const openLinkPopover = () => {
        ensureSelection();
        const sel = window.getSelection();
        const selectedText = sel && sel.rangeCount > 0 ? sel.toString() : '';
        setLinkLabel(selectedText);
        setLinkUrl('');
        togglePopover('link');
    };

    // Types the markdown link syntax (the same `[label](url)` syntax the info tip documents,
    // and the same thing a user typing it by hand would produce) as literal plain text at the
    // cursor/selection via execCommand('insertText', ...), rather than inserting a real <a> tag
    // into the editable region. That keeps the editor's content model exactly what it already
    // was - there's no live/editable anchor to fight with while typing nearby, and nothing here
    // can end up split across a formatting tag the way manually coloring a raw URL can (see
    // Linkifier.php's unwrap step for that failure mode) since this never leaves the editor at
    // all until the whole markdown text is already assembled.
    const insertLink = () => {
        const url = linkUrl.trim();
        if (!url) return;
        const label = linkLabel.trim() || url;
        // By the time this runs, real DOM focus is sitting in the popover's URL input (it has to
        // be, to type a URL into it) - not in the editor. Calling .focus() on the editor first
        // (as this used to) hands it a blank slate with no live Range, and most browsers default
        // that to the very start of the content, so the link always landed at the beginning of
        // the description no matter where the cursor had actually been left. Restoring the saved
        // Range *before* focusing gives the editor something to keep, so the link lands back
        // where the cursor was - unless the description was empty to begin with, in which case
        // start and "wherever the cursor was" are the same place anyway.
        ensureSelection();
        editorRef.current.focus();
        document.execCommand('insertText', false, `[${label}](${url})`);
        onChange(editorRef.current.innerHTML);
        setLinkLabel('');
        setLinkUrl('');
        setOpenPopover(null);
    };

    // Custom colors picked via the native <input type="color"> get remembered here so they show up
    // as reusable swatches instead of requiring the OS color picker to be reopened every time.
    const MAX_CUSTOM_COLORS = 8;
    const addCustomTextColor = (color) => {
        setCustomTextColors((prev) => (TEXT_COLORS.includes(color) || prev.includes(color) ? prev : [color, ...prev].slice(0, MAX_CUSTOM_COLORS)));
    };
    const addCustomHighlightColor = (color) => {
        setCustomHighlightColors((prev) => (HIGHLIGHT_COLORS.includes(color) || prev.includes(color) ? prev : [color, ...prev].slice(0, MAX_CUSTOM_COLORS)));
    };
    const removeCustomTextColor = (color) => setCustomTextColors((prev) => prev.filter((c) => c !== color));
    const removeCustomHighlightColor = (color) => setCustomHighlightColors((prev) => prev.filter((c) => c !== color));

    // Zero-width space used to anchor a collapsed-cursor font-size marker (see applyFontSize below).
    const ZWSP = '\u200b';

    const applyFontSize = (px) => {
        // See exec() above: restore the Range before focusing, not after.
        if (!ensureSelection()) { setOpenPopover(null); return; }
        editorRef.current.focus();
        const sel = window.getSelection();
        if (sel.rangeCount === 0) { setOpenPopover(null); return; }

        const range = sel.getRangeAt(0);

        if (sel.isCollapsed) {
            // Unlike Bold/Italic, font size isn't a native execCommand with "typing state" - there's
            // nothing to select yet, so wrapping a selection doesn't apply. Instead, plant an empty
            // styled span at the cursor (held open by a zero-width space) and move the cursor inside
            // it, so whatever gets typed next lands inside the span and inherits its size. Leftover
            // markers get cleaned up in handleInput/handleBlur below.
            const span = document.createElement('span');
            span.style.fontSize = px;
            span.appendChild(document.createTextNode(ZWSP));
            range.insertNode(span);
            const newRange = document.createRange();
            newRange.setStart(span.firstChild, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            setSavedRange(newRange.cloneRange());
            onChange(editorRef.current.innerHTML);
            setOpenPopover(null);
            return;
        }

        const span = document.createElement('span');
        span.style.fontSize = px;
        try {
            range.surroundContents(span);
        } catch {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        }
        sel.removeAllRanges();
        onChange(editorRef.current.innerHTML);
        setOpenPopover(null);
    };

    // Lets someone type an exact size (e.g. 21px) instead of picking from the four presets.
    // Reuses applyFontSize for the actual DOM work, then remembers the value as a chip so it
    // doesn't have to be retyped next time - same pattern as the custom color swatches above.
    const MIN_FONT_SIZE = 8;
    const MAX_FONT_SIZE = 96;
    const MAX_CUSTOM_SIZES = 5;
    const applyCustomFontSize = () => {
        const n = parseInt(customSize, 10);
        if (!n || n < MIN_FONT_SIZE || n > MAX_FONT_SIZE) return;
        const px = `${n}px`;
        applyFontSize(px);
        setCustomFontSizes((prev) => (
            prev.some((s) => s.px === px) || FONT_SIZES.some((s) => s.px === px)
                ? prev
                : [{ label: `${n}`, px }, ...prev].slice(0, MAX_CUSTOM_SIZES)
        ));
    };
    const removeCustomFontSize = (px) => setCustomFontSizes((prev) => prev.filter((s) => s.px !== px));

    const handleInput = () => {
        // Once real characters land after a marker's zero-width space (font-size markers below,
        // and RichTextEditor's own highlight-escape marker), drop the ZWSP so it doesn't linger
        // invisibly in the saved content forever. Uses deleteData(0, 1) rather than reassigning
        // .nodeValue wholesale: a full nodeValue reassignment makes the browser treat it as
        // replacing the *entire* string, which collapses any live cursor sitting in this text
        // node back to the very start of the new text instead of preserving its relative
        // position - visibly yanking the caret one character to the left of whatever was just
        // typed. deleteData with an explicit offset/count performs a genuine partial deletion,
        // which the DOM spec's Range/Selection boundary-point adjustment handles correctly.
        const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (node.nodeValue.length > 1 && node.nodeValue.startsWith(ZWSP)) {
                node.deleteData(0, 1);
            }
        }
        onChange(editorRef.current.innerHTML);
    };

    // If a font-size marker was planted but the person never actually typed anything into it
    // (opened the size picker, then clicked away), remove the empty span so it doesn't leave a
    // stray invisible character behind in the saved description.
    const handleBlur = () => {
        let changed = false;
        editorRef.current?.querySelectorAll('span').forEach((span) => {
            if (span.textContent === ZWSP && span.style.fontSize) {
                span.remove();
                changed = true;
            }
        });
        if (changed) onChange(editorRef.current.innerHTML);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '\t');
            onChange(editorRef.current.innerHTML);
        }
    };

    const togglePopover = (name) => setOpenPopover((prev) => (prev === name ? null : name));

    return (
        <div className="overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 dark:border-gray-700 dark:focus-within:border-indigo-500">
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                onFocus={updateActiveStates}
                onBlur={handleBlur}
                data-placeholder={placeholder}
                className="rt-content w-full overflow-y-auto whitespace-pre-wrap px-3.5 py-3 text-base leading-relaxed text-gray-900 outline-none empty:before:block empty:before:truncate empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] dark:bg-gray-900 dark:text-gray-100 dark:empty:before:text-gray-500 sm:text-sm"
                style={{ minHeight: `${rows * 1.5}rem`, maxHeight, tabSize: 4 }}
            />

            <div
                className="no-scrollbar flex flex-nowrap items-center gap-1 overflow-x-auto border-t border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-700 dark:bg-gray-900 sm:flex-wrap sm:gap-0.5 sm:overflow-x-visible sm:py-1.5"
                onMouseDownCapture={saveSelection}
            >
                <ToolbarButton active={activeStates.bold} onClick={() => exec('bold')} title="Bold">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 5h6a3.5 3.5 0 013.02 5.28A3.5 3.5 0 0114.5 17H7V5zm2.5 2v4H13a1.5 1.5 0 000-3H9.5zm0 6v4h5a1.5 1.5 0 000-3H9.5z" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton active={activeStates.italic} onClick={() => exec('italic')} title="Italic">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 5v2h2.2l-3.4 10H6v2h8v-2h-2.2l3.4-10H18V5z" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton active={activeStates.underline} onClick={() => exec('underline')} title="Underline">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4v7a6 6 0 0012 0V4h-2v7a4 4 0 01-8 0V4H6zM5 19h14v2H5v-2z" />
                    </svg>
                </ToolbarButton>

                <Divider />

                <Popover
                    open={openPopover === 'list'}
                    onToggle={() => togglePopover('list')}
                    onClose={() => setOpenPopover(null)}
                    width="10.5rem"
                    trigger={
                        <>
                            <svg className={`h-4 w-4 ${activeStates.list ? 'text-indigo-600 dark:text-indigo-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    }
                >
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyList('ul')}
                        className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs sm:py-1.5 ${
                            activeStates.list === 'ul'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                        </svg>
                        Bulleted list
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyList('ol')}
                        className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs sm:py-1.5 ${
                            activeStates.list === 'ol'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h12M9 12h12M9 18h12" />
                            <text x="1.5" y="7.5" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
                            <text x="1.5" y="13.5" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
                            <text x="1.5" y="19.5" fontSize="6" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
                        </svg>
                        Numbered list
                    </button>

                    <div className="my-1.5 h-px bg-gray-100 dark:bg-gray-700" />

                    <button
                        type="button"
                        disabled={!activeStates.list}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={indentList}
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:text-gray-600 sm:py-1.5"
                    >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 18h18M11 12h10M3 12l4-3v6z" />
                        </svg>
                        Increase indent
                    </button>
                    <button
                        type="button"
                        disabled={!activeStates.list}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={outdentList}
                        className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:text-gray-600 sm:py-1.5"
                    >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 18h18M11 12h10M7 9l-4 3 4 3z" />
                        </svg>
                        Decrease indent
                    </button>
                </Popover>

                <Divider />

                <Popover
                    open={openPopover === 'size'}
                    onToggle={() => togglePopover('size')}
                    onClose={() => setOpenPopover(null)}
                    width="9rem"
                    trigger={
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
                            </svg>
                            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </>
                    }
                >
                    <p className="mb-1 px-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">Applies to selection or new text</p>
                    {FONT_SIZES.map((s) => (
                        <button
                            key={s.px}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyFontSize(s.px)}
                            className="block w-full rounded px-2 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 sm:py-1.5"
                            style={{ fontSize: s.px }}
                        >
                            {s.label}
                        </button>
                    ))}

                    {customFontSizes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 border-t border-gray-100 px-1 pt-1.5 dark:border-gray-700">
                            {customFontSizes.map((s) => (
                                <div key={s.px} className="group relative">
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFontSize(s.px)}
                                        title={`${s.label}px`}
                                        className="rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        {s.label}
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => { e.stopPropagation(); removeCustomFontSize(s.px); }}
                                        title="Remove from list"
                                        className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[9px] leading-none text-white hover:bg-gray-900 group-hover:flex dark:bg-gray-300 dark:text-gray-800 dark:hover:bg-white sm:h-3.5 sm:w-3.5 [@media(hover:none)]:flex"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-1.5 flex items-center gap-1 border-t border-gray-100 px-1 pt-1.5 dark:border-gray-700">
                        <input
                            type="number"
                            min={MIN_FONT_SIZE}
                            max={MAX_FONT_SIZE}
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCustomFontSize(); } }}
                            placeholder="Custom"
                            className="w-16 rounded border border-gray-200 bg-transparent px-1.5 py-1.5 text-base text-gray-700 outline-none focus:border-indigo-400 dark:border-gray-600 dark:text-gray-300 sm:w-14 sm:py-1 sm:text-xs"
                        />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">px</span>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={applyCustomFontSize}
                            className="ml-auto rounded px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 sm:px-1.5 sm:py-1"
                        >
                            Apply
                        </button>
                    </div>
                </Popover>

                <Divider />

                <Popover
                    open={openPopover === 'color'}
                    onToggle={() => togglePopover('color')}
                    onClose={() => setOpenPopover(null)}
                    width="10rem"
                    trigger={
                        <>
                            <span className="flex h-4 w-4 items-center justify-center font-bold text-gray-600 dark:text-gray-300">A</span>
                            <span className="h-1 w-4 rounded-sm" style={{ backgroundColor: customColor }} />
                        </>
                    }
                >
                    <p className="mb-1.5 px-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">Text Color</p>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={applyDefaultTextColor}
                        title="Default (follows theme)"
                        className="mb-1.5 flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <span
                            className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-gray-300 dark:border-gray-500"
                            style={{ background: 'linear-gradient(to bottom right, #111827 49.5%, #ffffff 50.5%)' }}
                        />
                        Default
                    </button>
                    <div className="grid grid-cols-5 gap-1.5 px-1">
                        {TEXT_COLORS.map((c) => (
                            <ColorSwatch key={c} color={c} onClick={() => { setCustomColor(c); applyTextColor(c); }} />
                        ))}
                        {customTextColors.map((c) => (
                            <ColorSwatch
                                key={c}
                                color={c}
                                onClick={() => { setCustomColor(c); applyTextColor(c); }}
                                onRemove={() => removeCustomTextColor(c)}
                            />
                        ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded px-1 py-2 text-xs text-gray-500 dark:text-gray-400 sm:py-1">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0 sm:h-5 sm:w-5"
                        />
                        <span>Custom</span>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { addCustomTextColor(customColor); applyTextColor(customColor); }}
                            className="ml-auto rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                        >
                            Apply
                        </button>
                    </div>
                </Popover>

                <Popover
                    open={openPopover === 'highlight'}
                    onToggle={() => togglePopover('highlight')}
                    onClose={() => setOpenPopover(null)}
                    width="10.5rem"
                    leadingButton={
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleHighlightAtCursor}
                            title={activeStates.highlight ? 'Remove highlight' : 'Highlight (uses last color)'}
                            className={`flex h-9 items-center gap-1 px-2 transition sm:h-8 ${
                                activeStates.highlight
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                    : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l6-6m-6 6l-3 8 8-3m-5-5l5 5M17 5l2 2" />
                            </svg>
                            <span className="h-1 w-3 rounded-sm" style={{ backgroundColor: lastHighlightColor }} />
                        </button>
                    }
                    trigger={
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    }
                >
                    <p className="mb-1.5 px-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">Highlight</p>
                    <div className="grid grid-cols-6 gap-1.5 px-1">
                        {HIGHLIGHT_COLORS.map((c) => (
                            <ColorSwatch key={c} color={c} onClick={() => toggleHighlight(c)} title="Click again to remove" />
                        ))}
                        {customHighlightColors.map((c) => (
                            <ColorSwatch
                                key={c}
                                color={c}
                                onClick={() => toggleHighlight(c)}
                                onRemove={() => removeCustomHighlightColor(c)}
                            />
                        ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded px-1 py-2 text-xs text-gray-500 dark:text-gray-400 sm:py-1">
                        <input
                            type="color"
                            value={customHighlight}
                            onChange={(e) => setCustomHighlight(e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0 sm:h-5 sm:w-5"
                        />
                        <span>Custom</span>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { addCustomHighlightColor(customHighlight); applyHighlight(customHighlight); }}
                            className="ml-auto rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                        >
                            Apply
                        </button>
                    </div>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={clearHighlight}
                        className="mt-2 block w-full rounded px-1 py-1 text-left text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        Remove highlight
                    </button>
                </Popover>

                <Divider />

                <ToolbarButton onClick={() => exec('removeFormat')} title="Clear formatting">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10 5h9M6 5h1m6 14H6a2 2 0 01-2-2V9m5-4L7 15" />
                    </svg>
                </ToolbarButton>

                <Divider />

                <Popover
                    open={openPopover === 'link'}
                    onToggle={openLinkPopover}
                    onClose={() => setOpenPopover(null)}
                    width="16rem"
                    trigger={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                        </svg>
                    }
                >
                    <div className="space-y-2 px-1 py-0.5">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Label</label>
                            <input
                                type="text"
                                value={linkLabel}
                                onChange={(e) => setLinkLabel(e.target.value)}
                                placeholder="Link text"
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">URL</label>
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } }}
                                placeholder="https://example.com"
                                ref={linkUrlInputRef}
                                className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                        </div>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={insertLink}
                            disabled={!linkUrl.trim()}
                            className="w-full rounded-md bg-indigo-600 px-2 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Insert link
                        </button>
                    </div>
                </Popover>

                <Divider />

                <Popover
                    open={openPopover === 'tip'}
                    onToggle={() => togglePopover('tip')}
                    onClose={() => setOpenPopover(null)}
                    width="14rem"
                    trigger={
                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                >
                    <p className="px-1 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-mono">[label](https://example.com)</span> turns into a clickable link.
                    </p>
                </Popover>
            </div>
        </div>
    );
}