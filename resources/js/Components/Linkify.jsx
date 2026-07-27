// Matches, in order: an @mention token (@[Label](user:ID) or @[Label](role:token)),
// a markdown-style link [label](url), or a bare http(s)/www URL. Order matters —
// the mention form is tried first since it also uses [label](...) syntax, and the
// markdown link form is tried before the bare-URL branch so its URL (inside parens)
// doesn't also get caught there.
const LINK_PATTERN = /@\[([^\]]+)\]\((user:\d+|role:[a-z]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s()<>"']+|www\.[^\s()<>"']+)\)|(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+)/g;

const linkClassName = 'text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300';
const mentionClassName = 'rounded px-1 py-0.5 font-medium text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900';

function toHref(url) {
    return url.startsWith('www.') ? `https://${url}` : url;
}

/**
 * Renders `text` with links and @mentions turned into styled elements. Supports:
 *   - @mentions: @[Alex Chen](user:12) or @[managers](role:manager) — shown as a chip
 *   - Markdown-style: [Open a ticket](https://example.com/feedback) — shows custom label text
 *   - Bare URLs: https://example.com or www.example.com — shown as-is
 *
 * Safe against XSS by construction: React escapes all text nodes, and we never
 * use dangerouslySetInnerHTML. The URL portion of both forms excludes quotes,
 * angle brackets, and (for the markdown form) parens, so a match can never
 * break out of the href="..." attribute or the surrounding (...) syntax, and
 * only ever produces http(s):// URLs — never javascript: or similar. The mention
 * form's target is restricted to `user:<digits>` or `role:<lowercase letters>`,
 * so it never becomes a clickable link at all — just a plain styled span.
 *
 * Pair with a `whitespace-pre-wrap` container to also preserve line breaks.
 */
export default function Linkify({ text }) {
    if (!text) return null;

    const str = String(text);
    const nodes = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    LINK_PATTERN.lastIndex = 0;
    while ((match = LINK_PATTERN.exec(str)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(<span key={key++}>{str.slice(lastIndex, match.index)}</span>);
        }

        const [, mentionLabel, , markdownLabel, markdownUrl, bareUrl] = match;

        if (mentionLabel !== undefined) {
            nodes.push(
                <span key={key++} className={mentionClassName}>@{mentionLabel}</span>
            );
        } else {
            const isMarkdown = markdownLabel !== undefined;
            const url = isMarkdown ? markdownUrl : bareUrl;

            nodes.push(
                <a key={key++} href={toHref(url)} target="_blank" rel="noopener noreferrer nofollow ugc" className={linkClassName}>
                    {isMarkdown ? markdownLabel : url}
                </a>
            );
        }

        lastIndex = LINK_PATTERN.lastIndex;
    }

    if (lastIndex < str.length) {
        nodes.push(<span key={key++}>{str.slice(lastIndex)}</span>);
    }

    return nodes;
}
