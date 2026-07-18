const URL_SPLIT = /(https?:\/\/[^\s<>"')]+|www\.[^\s<>"')]+)/g;
const URL_TEST = /^(https?:\/\/|www\.)/i;

/**
 * Renders `text` with any http(s):// or www. URLs turned into clickable links.
 * Safe against XSS by construction: React escapes all text nodes, and we never
 * use dangerouslySetInnerHTML — matched substrings only ever become an `href`
 * on an anchor tag, and the regex can only match http(s)/www strings, so
 * schemes like javascript: can't sneak through.
 *
 * Pair with a `whitespace-pre-wrap` container to also preserve line breaks.
 */
export default function Linkify({ text }) {
    if (!text) return null;

    const parts = String(text).split(URL_SPLIT);

    return parts.map((part, i) => {
        if (URL_TEST.test(part)) {
            const href = part.startsWith('www.') ? `https://${part}` : part;
            return (
                <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    {part}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}
