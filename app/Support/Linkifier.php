<?php

namespace App\Support;

class Linkifier
{
    /**
     * Turns links in $html into real, clickable <a> tags. Supports two forms:
     *   - Markdown-style: [Open a ticket](https://example.com/feedback) — custom label text
     *   - Bare URLs: https://example.com or www.example.com — shown as-is
     *
     * Safe by construction:
     * - Splits on tags first and only touches text nodes, so existing markup
     *   (and anything inside an attribute) is never altered. Because of that
     *   split, a text node can never contain a literal "<", so the markdown
     *   link's label capture (which allows most characters) can't smuggle in
     *   an unescaped tag either.
     * - Both URL forms exclude quotes and angle brackets, and the markdown
     *   form's URL additionally excludes parens, so a match can never break
     *   out of the href="..." attribute or the surrounding (...) syntax.
     * - Only ever produces http(s):// hrefs (a bare "www." match is given an
     *   https:// prefix), so a javascript: or data: URL can't be produced.
     *
     * Intended to run once, server-side, right after the existing strip_tags
     * allow-list sanitization and before saving — the stored HTML then already
     * contains real anchors, so nothing extra is needed on the display side.
     */
    public static function linkify(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        $parts = preg_split('/(<[^>]+>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        if ($parts === false) {
            return $html;
        }

        // Group 1+2: markdown [label](url). Group 3: bare URL. Tried in that order so a
        // markdown link's URL (inside parens) isn't also caught by the bare-URL branch.
        $linkPattern = '/\[([^\]]+)\]\((https?:\/\/[^\s()<>"\']+|www\.[^\s()<>"\']+)\)|(https?:\/\/[^\s<>"\')]+|www\.[^\s<>"\')]+)/i';
        $class = 'text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300';

        foreach ($parts as &$part) {
            if ($part === '' || $part[0] === '<') {
                continue; // an existing tag — leave it untouched
            }

            $part = preg_replace_callback($linkPattern, function ($m) use ($class) {
                if (isset($m[1]) && $m[1] !== '') {
                    $label = $m[1];
                    $url = $m[2];
                    $href = str_starts_with($url, 'www.') ? "https://{$url}" : $url;

                    return "<a href=\"{$href}\" target=\"_blank\" rel=\"noopener noreferrer nofollow ugc\" class=\"{$class}\">{$label}</a>";
                }

                $url = $m[3];
                // Trim common trailing punctuation that's almost always part of the
                // surrounding sentence, not the URL (e.g. "check example.com.").
                $trailing = '';
                if (preg_match('/^(.*?)([.,!?;:\)]+)$/', $url, $tm)) {
                    $url = $tm[1];
                    $trailing = $tm[2];
                }
                $href = str_starts_with($url, 'www.') ? "https://{$url}" : $url;

                return "<a href=\"{$href}\" target=\"_blank\" rel=\"noopener noreferrer nofollow ugc\" class=\"{$class}\">{$url}</a>{$trailing}";
            }, $part);
        }

        return implode('', $parts);
    }

    /**
     * Reverses linkify(): turns any <a href="URL" ...>LABEL</a> anchor back into the
     * markdown-style `[LABEL](URL)` text that linkify() itself knows how to rebuild.
     *
     * Why this exists: descriptions get re-submitted through strip_tags() (which
     * allow-lists <b>/<i>/<span>/etc but not <a>, since letting arbitrary <a ...>
     * attributes through unsanitized would be an XSS hole) every time they're saved,
     * including on an edit of content that was already linkified on a previous save.
     * Without this step, strip_tags() would delete the <a> wrapper but leave the
     * inert label text behind — silently turning a working link back into plain text
     * on every subsequent edit. Calling this first converts any existing anchors back
     * into plain markdown text, so strip_tags() has nothing to strip and linkify()
     * re-creates the exact same anchor afterward.
     *
     * Any markup nested inside the label is stripped in the process — linkify() only
     * ever produces plain-text link bodies, so there's normally nothing nested there,
     * but this keeps a stray tag from leaking into the markdown form either way.
     */
    public static function unlinkify(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        return preg_replace_callback(
            '/<a\s+[^>]*href\s*=\s*"([^"]*)"[^>]*>(.*?)<\/a>/is',
            function ($m) {
                $href = $m[1];
                $label = trim(strip_tags($m[2]));

                return $label === '' ? $href : "[{$label}]({$href})";
            },
            $html
        );
    }
}
