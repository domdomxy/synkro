import { useRef, useEffect, useState, useCallback } from 'react';

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
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
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
    return <div className="mx-1 h-5 w-px shrink-0 bg-gray-300 dark:bg-gray-600" />;
}

function Popover({ trigger, children, open, onToggle, onClose, width = 'auto' }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onToggle}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
                {trigger}
            </button>
            {open && (
                <div
                    className="absolute bottom-full left-0 z-20 mb-2 rounded-lg bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                    style={{ width }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write something...', rows = 4, maxHeight = '16rem' }) {
    const editorRef = useRef(null);
    const isFirstRender = useRef(true);
    const [savedRange, setSavedRange] = useState(null);
    const [openPopover, setOpenPopover] = useState(null); // 'color' | 'highlight' | 'size' | null
    const [activeStates, setActiveStates] = useState({ bold: false, italic: false, underline: false });
    const [customColor, setCustomColor] = useState('#111827');

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
    }, []);

    const updateActiveStates = useCallback(() => {
        try {
            setActiveStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
            });
        } catch {
            // queryCommandState can throw outside a focused editable context — ignore
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

    const exec = (command, arg = null) => {
        editorRef.current.focus();
        document.execCommand('styleWithCSS', false, true);
        restoreSelection();
        document.execCommand(command, false, arg);
        onChange(editorRef.current.innerHTML);
        updateActiveStates();
    };

    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return `rgb(${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255})`;
    };

    const toggleHighlight = (color) => {
        editorRef.current.focus();
        document.execCommand('styleWithCSS', false, true);
        restoreSelection();
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const node = selection.anchorNode?.parentElement;
            const current = node ? window.getComputedStyle(node).backgroundColor : null;
            if (current === hexToRgb(color)) {
                document.execCommand('hiliteColor', false, 'transparent');
                onChange(editorRef.current.innerHTML);
                setOpenPopover(null);
                return;
            }
        }
        document.execCommand('hiliteColor', false, color);
        onChange(editorRef.current.innerHTML);
        setOpenPopover(null);
    };

    const clearHighlight = () => { exec('hiliteColor', 'transparent'); setOpenPopover(null); };

    const applyTextColor = (color) => { exec('foreColor', color); setOpenPopover(null); };

    const applyFontSize = (px) => {
        editorRef.current.focus();
        if (!restoreSelection()) { setOpenPopover(null); return; }
        const sel = window.getSelection();
        if (sel.rangeCount === 0 || sel.isCollapsed) { setOpenPopover(null); return; }

        const range = sel.getRangeAt(0);
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

    const handleInput = () => onChange(editorRef.current.innerHTML);

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
                data-placeholder={placeholder}
                className="w-full overflow-y-auto whitespace-pre-wrap px-3.5 py-3 text-sm leading-relaxed text-gray-900 outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] dark:bg-gray-900 dark:text-gray-100 dark:empty:before:text-gray-500"
                style={{ minHeight: `${rows * 1.5}rem`, maxHeight }}
            />

            <div className="flex flex-wrap items-center gap-0.5 border-t border-gray-200 bg-gray-50 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900">
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
                    <p className="mb-1 px-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">Select text first</p>
                    {FONT_SIZES.map((s) => (
                        <button
                            key={s.px}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyFontSize(s.px)}
                            className="block w-full rounded px-2 py-1.5 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            style={{ fontSize: s.px }}
                        >
                            {s.label}
                        </button>
                    ))}
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
                    <div className="grid grid-cols-5 gap-1.5 px-1">
                        {TEXT_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setCustomColor(c); applyTextColor(c); }}
                                title={c}
                                className="h-6 w-6 rounded-full border border-gray-200 transition hover:scale-110 dark:border-gray-600"
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <label className="mt-2 flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            onBlur={() => applyTextColor(customColor)}
                            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        Custom
                    </label>
                </Popover>

                <Popover
                    open={openPopover === 'highlight'}
                    onToggle={() => togglePopover('highlight')}
                    onClose={() => setOpenPopover(null)}
                    width="9.5rem"
                    trigger={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l6-6m-6 6l-3 8 8-3m-5-5l5 5M17 5l2 2" />
                        </svg>
                    }
                >
                    <p className="mb-1.5 px-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">Highlight</p>
                    <div className="grid grid-cols-6 gap-1.5 px-1">
                        {HIGHLIGHT_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => toggleHighlight(c)}
                                title="Click again to remove"
                                className="h-6 w-6 rounded-full border border-gray-200 transition hover:scale-110 dark:border-gray-600"
                                style={{ backgroundColor: c }}
                            />
                        ))}
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
            </div>
        </div>
    );
}