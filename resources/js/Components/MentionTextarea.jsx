import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';

const ROLE_LABELS = {
    everyone: 'everyone',
    owner: 'owner',
    manager: 'managers',
    tester: 'testers',
    member: 'members',
};

// Same token shape MentionParser.php / Linkify.jsx / NoteFormatter.php already
// parse: @[Label](user:ID) or @[Label](role:token). This component only
// changes how that token LOOKS while someone is composing or editing a
// comment (a styled "@Label" chip instead of the raw brackets) - the value
// that actually flows through `onChange`, gets submitted, stored, broadcast,
// and emailed is still that exact same token string. Nothing server-side, and
// nothing about how a posted comment or notification renders, needs to change.
const MENTION_TOKEN = /@\[([^\]]+)\]\((user:\d+|role:[a-z]+)\)/g;

// Matches only role:token mentions (not user:ID ones) inside a raw comment
// body. Used by callers (TaskRow) to decide whether posting/editing a
// comment should be confirmed first, since a role mention notifies a whole
// group of people at once rather than a single person.
const ROLE_MENTION_TOKEN = /@\[([^\]]+)\]\(role:([a-z]+)\)/g;

/**
 * Returns the distinct role tokens (e.g. ['manager', 'everyone']) mentioned
 * in a raw comment body, in first-seen order.
 */
export function extractRoleMentions(raw) {
    if (!raw) return [];
    const roles = [];
    let match;
    ROLE_MENTION_TOKEN.lastIndex = 0;
    while ((match = ROLE_MENTION_TOKEN.exec(raw)) !== null) {
        if (!roles.includes(match[2])) roles.push(match[2]);
    }
    return roles;
}

export { ROLE_LABELS };

/**
 * Splits a raw value into an ordered list of plain-text and mention segments,
 * for building the editable DOM from a `value` that came from outside this
 * component (initial mount, an existing comment's body loading into the edit
 * box, or the field resetting after submit).
 */
function segmentsFromRaw(raw) {
    const segments = [];
    let lastIndex = 0;
    let match;
    MENTION_TOKEN.lastIndex = 0;
    while ((match = MENTION_TOKEN.exec(raw)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
        }
        segments.push({ type: 'mention', label: match[1], target: match[2] });
        lastIndex = MENTION_TOKEN.lastIndex;
    }
    if (lastIndex < raw.length) {
        segments.push({ type: 'text', content: raw.slice(lastIndex) });
    }
    return segments;
}

// An atomic, non-editable chip - same visual treatment Linkify.jsx already
// gives a resolved mention in a posted comment, so composing and reading a
// comment look the same. The token's target (user:ID or role:token) is kept
// on the node itself via a data attribute, so serializing back to the raw
// string never needs a name/id lookup - just what's already on the chip.
function makeMentionChip(label, target) {
    const chip = document.createElement('span');
    chip.contentEditable = 'false';
    chip.dataset.mentionTarget = target;
    chip.className = 'select-none rounded px-1 py-0.5 font-medium text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900';
    chip.textContent = `@${label}`;
    return chip;
}

function renderRawIntoDom(container, raw) {
    container.innerHTML = '';
    for (const seg of segmentsFromRaw(raw)) {
        container.appendChild(
            seg.type === 'mention' ? makeMentionChip(seg.label, seg.target) : document.createTextNode(seg.content)
        );
    }
}

// Walks the DOM back into the same raw token string renderRawIntoDom builds
// it from. Anything that isn't a plain text node or one of our own mention
// chips (e.g. formatting a browser might try to paste in) is defensively
// flattened to its text content rather than dropped.
function serializeDomToRaw(container) {
    let raw = '';
    container.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            raw += node.textContent;
        } else if (node.dataset?.mentionTarget) {
            raw += `@[${node.textContent.replace(/^@/, '')}](${node.dataset.mentionTarget})`;
        } else {
            raw += node.textContent;
        }
    });
    return raw;
}

/**
 * Finds an in-progress @mention query ending at the caret, if the caret sits
 * inside a plain text node of `container`. Same rule the plain-textarea
 * version used: an "@" only starts a mention at the very start of that text
 * run, or after whitespace - which also covers right after a mention chip or
 * at the start of a line, since neither leaves anything for `at > 0` to see
 * inside this text node. Breaks (returns null) once whitespace or "]"
 * appears after the "@", same as before.
 */
function findActiveMention(container) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;
    const node = selection.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE || !container.contains(node)) return null;

    const cursor = selection.anchorOffset;
    const text = node.textContent;
    const uptoCursor = text.slice(0, cursor);
    const at = uptoCursor.lastIndexOf('@');
    if (at === -1) return null;
    if (at > 0 && !/\s/.test(uptoCursor[at - 1])) return null;
    const query = uptoCursor.slice(at + 1);
    if (/[\s\]]/.test(query)) return null;
    return { node, start: at, cursor, query };
}

/**
 * Drop-in replacement for AutoGrowTextarea that adds Slack/GitHub-style
 * @mention autocomplete: typing "@" opens a picker of project members and
 * roles (plus "everyone"), and selecting one inserts an inline "@Label" chip.
 *
 * A plain `<textarea>` can only ever show literal characters, so it had no
 * way to display the inserted `@[Label](user:ID)` token as anything other
 * than those literal brackets. This is a contenteditable div instead:
 * `value` / `onChange` behave the same as a controlled textarea from the
 * outside (the value is still the same raw token string), but internally the
 * DOM is kept in sync with it (chip nodes <-> tokens) rather than being that
 * string verbatim.
 *
 * `members` should be the project's member list (each with `id`, `name`, and
 * optionally `pivot.role`) - the same shape already passed around elsewhere.
 */
export default function MentionTextarea({ value, onChange, members = [], onKeyDown, placeholder, className = '', autoFocus, canMentionEveryone = true, ...props }) {
    const containerRef = useRef(null);
    const lastSyncedRef = useRef(); // raw value the DOM currently reflects
    const [mention, setMention] = useState(null); // { node, start, cursor, query } | null
    const [highlighted, setHighlighted] = useState(0);
    const [empty, setEmpty] = useState(!value);

    const availableRoles = Array.from(new Set(members.map((m) => m.pivot?.role).filter(Boolean)));
    // "everyone" pings the whole project at once, so only managers/owners get
    // it offered as a suggestion - mirrors the backend check in
    // CommentController, which rejects it from anyone else regardless.
    const roleOptions = [...(canMentionEveryone ? ['everyone'] : []), ...availableRoles].map((role) => ({
        type: 'role',
        token: role,
        label: ROLE_LABELS[role] ?? role,
    }));
    const memberOptions = members.map((m) => ({ type: 'user', id: m.id, label: m.name, user: m }));

    const query = (mention?.query ?? '').toLowerCase();
    const suggestions = [
        ...roleOptions.filter((r) => r.label.toLowerCase().startsWith(query)),
        ...memberOptions.filter((m) => m.label.toLowerCase().includes(query)),
    ].slice(0, 8);

    useEffect(() => {
        setHighlighted(0);
    }, [mention?.query]);

    // Rebuild the DOM only when `value` changed from OUTSIDE this component -
    // initial mount, the form resetting after a successful submit, or an
    // existing comment's body loading into the edit box. Our own keystrokes
    // flow back through this same `value` prop too (the parent just mirrors
    // whatever we last emitted), so skip rebuilding then or the caret would
    // jump to the start of the field on every character typed.
    useLayoutEffect(() => {
        const raw = value ?? '';
        if (raw === lastSyncedRef.current) return;
        const el = containerRef.current;
        if (!el) return;
        renderRawIntoDom(el, raw);
        lastSyncedRef.current = raw;
        setEmpty(!raw);
    }, [value]);

    useEffect(() => {
        if (autoFocus) containerRef.current?.focus();
    }, [autoFocus]);

    const emitChange = () => {
        const el = containerRef.current;
        if (!el) return;
        const raw = serializeDomToRaw(el);
        lastSyncedRef.current = raw;
        setEmpty(!raw);
        onChange(raw);
    };

    const handleInput = () => {
        emitChange();
        setMention(findActiveMention(containerRef.current));
    };

    const insertMention = (option) => {
        if (!mention) return;
        const { node, start, cursor } = mention;
        const text = node.textContent;
        const before = text.slice(0, start);
        const after = text.slice(cursor);
        const chip = makeMentionChip(option.label, option.type === 'role' ? `role:${option.token}` : `user:${option.id}`);
        const afterNode = document.createTextNode(` ${after}`);

        const parent = node.parentNode;
        node.textContent = before;
        parent.insertBefore(chip, node.nextSibling);
        parent.insertBefore(afterNode, chip.nextSibling);

        // Caret right after the inserted space, same spot the old version left it.
        const range = document.createRange();
        range.setStart(afterNode, 1);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        setMention(null);
        emitChange();
    };

    const handleKeyDown = (e) => {
        if (mention && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlighted((h) => (h + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(suggestions[highlighted]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setMention(null);
                return;
            }
        }

        if (e.key === 'Enter') {
            // Let the caller decide first (both call sites preventDefault() to
            // submit on a plain Enter and allow Shift+Enter through for a new
            // line, same contract AutoGrowTextarea's onKeyDown had).
            onKeyDown?.(e);
            if (!e.defaultPrevented) {
                // A contenteditable's default Enter behavior inserts a <div> or
                // <br> block, which serializeDomToRaw doesn't know about. Insert
                // a literal newline character instead - the container renders
                // with white-space: pre-wrap, so it still shows as a line break,
                // and it round-trips through the raw string exactly like a
                // textarea's "\n" always did.
                e.preventDefault();
                document.execCommand('insertText', false, '\n');
                handleInput();
            }
            return;
        }

        onKeyDown?.(e);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        handleInput();
    };

    const handleBlur = (e) => {
        // Let a click on a suggestion register (onMouseDown fires first and
        // calls preventDefault) before the picker disappears on blur.
        setTimeout(() => setMention(null), 100);
        props.onBlurProp?.(e);
    };

    return (
        <div className="relative">
            <div
                ref={containerRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={handleBlur}
                className={
                    'w-full border px-3 py-2 whitespace-pre-wrap break-words focus:outline-none focus:ring-1 ' +
                    'focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-600 dark:focus:ring-indigo-600 ' +
                    (empty
                        ? 'before:content-[attr(data-placeholder)] before:block before:truncate before:text-gray-400 before:pointer-events-none dark:before:text-gray-500 '
                        : '') +
                    className
                }
                {...props}
            />
            {mention && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 z-30 mb-1 max-h-52 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {suggestions.map((s, i) => (
                        <button
                            type="button"
                            key={s.type === 'role' ? `role-${s.token}` : `user-${s.id}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                insertMention(s);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                                i === highlighted
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                    : 'text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {s.type === 'user' ? (
                                <>
                                    <Avatar user={s.user} size="h-5 w-5" />
                                    <span className="truncate">{s.label}</span>
                                </>
                            ) : (
                                <>
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                                        @
                                    </span>
                                    <span className="truncate capitalize">{s.label}</span>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
