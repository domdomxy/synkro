// Matches either a markdown-style link [label](url), or a bare http(s)/www URL.
// Alternation order matters: the markdown form is tried first so its URL (inside
// parens) doesn't also get caught by the bare-URL branch.
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s()<>"']+|www\.[^\s()<>"']+)\)|(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+)/g;

const linkClassName = 'text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300';

function toHref(url) {
    return url.startsWith('www.') ? `https://${url}` : url;
}

/**
 * Renders `text` with links turned into clickable <a> tags. Supports two forms:
 *   - Markdown-style: [Open a ticket](https://example.com/feedback) — shows custom label text
 *   - Bare URLs: https://example.com or www.example.com — shown as-is
 *
 * Safe against XSS by construction: React escapes all text nodes, and we never
 * use dangerouslySetInnerHTML. The URL portion of both forms excludes quotes,
 * angle brackets, and (for the markdown form) parens, so a match can never
 * break out of the href="..." attribute or the surrounding (...) syntax, and
 * only ever produces http(s):// URLs — never javascript: or similar.
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

        const [, label, markdownUrl, bareUrl] = match;
        const isMarkdown = label !== undefined;
        const url = isMarkdown ? markdownUrl : bareUrl;

        nodes.push(
            <a key={key++} href={toHref(url)} target="_blank" rel="noopener noreferrer nofollow ugc" className={linkClassName}>
                {isMarkdown ? label : url}
            </a>
        );

        lastIndex = LINK_PATTERN.lastIndex;
    }

    if (lastIndex < str.length) {
        nodes.push(<span key={key++}>{str.slice(lastIndex)}</span>);
    }

    return nodes;
}
