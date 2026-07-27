import { useEffect, useRef, useState } from 'react';
import AutoGrowTextarea from '@/Components/AutoGrowTextarea';
import Avatar from '@/Components/Avatar';

const ROLE_LABELS = {
    everyone: 'everyone',
    owner: 'owner',
    manager: 'managers',
    tester: 'testers',
    member: 'members',
};

/**
 * Finds an in-progress @mention query ending at `cursor`, if any. An "@" only
 * starts a mention when it's at the very start of the text or preceded by
 * whitespace — this keeps a mid-word "@" (like in someone@example.com) from
 * triggering the picker. The query breaks (returns null) as soon as whitespace
 * or a closing bracket appears after the "@", since that means either the
 * person kept typing past the mention or a token was already inserted there.
 */
function findActiveMention(text, cursor) {
    const uptoCursor = text.slice(0, cursor);
    const at = uptoCursor.lastIndexOf('@');
    if (at === -1) return null;
    if (at > 0 && !/\s/.test(uptoCursor[at - 1])) return null;
    const query = uptoCursor.slice(at + 1);
    if (/[\s\]]/.test(query)) return null;
    return { start: at, query };
}

/**
 * Drop-in replacement for AutoGrowTextarea that adds Slack/GitHub-style @mention
 * autocomplete: typing "@" opens a picker of project members and roles (plus
 * "everyone"), and selecting one inserts a `@[Label](user:ID)` or
 * `@[Label](role:token)` token. That markdown-like token is the same convention
 * already used for links in comments (see Linkify.jsx), which also knows how to
 * render these tokens back into styled mention chips.
 *
 * `members` should be the project's member list (each with `id`, `name`, and
 * optionally `pivot.role`) — the same shape already passed around as `members`
 * elsewhere on this page, so no extra data fetching is needed.
 */
export default function MentionTextarea({ value, onChange, members = [], onKeyDown, ...props }) {
    const textareaRef = useRef(null);
    const [mention, setMention] = useState(null); // { start, query } | null
    const [highlighted, setHighlighted] = useState(0);

    const availableRoles = Array.from(new Set(members.map((m) => m.pivot?.role).filter(Boolean)));
    const roleOptions = ['everyone', ...availableRoles].map((role) => ({
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

    const handleChange = (e) => {
        const newValue = e.target.value;
        onChange(newValue);
        setMention(findActiveMention(newValue, e.target.selectionStart));
    };

    const insertMention = (option) => {
        if (!mention) return;
        const el = textareaRef.current;
        const cursor = el ? el.selectionStart : value.length;
        const token = option.type === 'role'
            ? `@[${option.label}](role:${option.token})`
            : `@[${option.label}](user:${option.id})`;
        const before = value.slice(0, mention.start);
        const after = value.slice(cursor);
        const newValue = `${before}${token} ${after}`;

        onChange(newValue);
        setMention(null);

        // Wait a tick for the value/height update to land before moving the caret.
        requestAnimationFrame(() => {
            if (!el) return;
            const newCursor = before.length + token.length + 1;
            el.focus();
            el.setSelectionRange(newCursor, newCursor);
        });
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
        onKeyDown?.(e);
    };

    return (
        <div className="relative">
            <AutoGrowTextarea
                {...props}
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={(e) => {
                    // Let a click on a suggestion register (onMouseDown fires first and
                    // calls preventDefault) before the picker disappears on blur.
                    setTimeout(() => setMention(null), 100);
                    props.onBlurProp?.(e);
                }}
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
