<?php

namespace App\Support;

class Linkifier
{
    /**
     * Turns bare http(s)/www URLs in $html into real, clickable <a> tags.
     *
     * Safe by construction:
     * - Splits on tags first and only touches text nodes, so existing markup
     *   (and anything inside an attribute) is never altered.
     * - The URL pattern excludes quotes and angle brackets, so a match can
     *   never break out of the href="..." attribute or inject a new tag.
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

        $urlPattern = '/(https?:\/\/[^\s<>"\']+|www\.[^\s<>"\']+)/i';

        foreach ($parts as &$part) {
            if ($part === '' || $part[0] === '<') {
                continue; // an existing tag — leave it untouched
            }

            $part = preg_replace_callback($urlPattern, function ($m) {
                $url = $m[0];
                // Trim common trailing punctuation that's almost always part of the
                // surrounding sentence, not the URL (e.g. "check example.com.").
                $trailing = '';
                if (preg_match('/^(.*?)([.,!?;:\)]+)$/', $url, $tm)) {
                    $url = $tm[1];
                    $trailing = $tm[2];
                }
                $href = str_starts_with($url, 'www.') ? "https://{$url}" : $url;
                $class = 'text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300';

                return "<a href=\"{$href}\" target=\"_blank\" rel=\"noopener noreferrer nofollow ugc\" class=\"{$class}\">{$url}</a>{$trailing}";
            }, $part);
        }

        return implode('', $parts);
    }
}
