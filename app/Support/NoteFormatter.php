<?php

namespace App\Support;

class NoteFormatter
{
    /**
     * Render a free-form note (one point per line, optional **bold** markers
     * and links) as safe HTML: a bullet list for multiple lines, a single
     * paragraph otherwise. All user input is escaped before any HTML is added.
     */
    public static function toHtml(string $note): string
    {
        $lines = collect(preg_split('/\r\n|\r|\n/', $note))
            ->map(fn ($line) => trim($line))
            ->filter(fn ($line) => $line !== '')
            ->values();

        if ($lines->isEmpty()) {
            return '';
        }

        if ($lines->count() === 1) {
            return '<p style="margin:0; font-size:15px; color:#374151; line-height:1.6;">'
                .self::formatLine($lines->first())
                .'</p>';
        }

        $items = $lines
            ->map(fn ($line) => '<li style="margin:0 0 6px; font-size:15px; color:#374151; line-height:1.6;">'.self::formatLine($line).'</li>')
            ->implode('');

        return '<ul style="margin:0; padding-left:20px;">'.$items.'</ul>';
    }

    /**
     * Format a single line of free-form text as safe HTML (bold + links),
     * without the list/paragraph wrapper. Useful for callers that already
     * manage their own block-level markup, e.g. email body paragraphs.
     */
    public static function line(string $line): string
    {
        return self::formatLine($line);
    }

    private static function formatLine(string $line): string
    {
        $escaped = e($line);

        $escaped = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $escaped);

        return self::linkify($escaped);
    }

    /**
     * Turn markdown-style [label](https://url) and bare https:// URLs into
     * anchor tags. Runs on already-HTML-escaped text, so it's safe to call
     * after formatLine's escaping step; the single regex pass (markdown
     * pattern first, bare URL as fallback) avoids re-linkifying text we
     * just inserted into an href/label.
     */
    private static function linkify(string $escapedText): string
    {
        $pattern = '/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/';

        return preg_replace_callback($pattern, function ($m) {
            if (! empty($m[2])) {
                return self::anchor($m[2], $m[1]);
            }

            $url = $m[3] ?? $m[0];
            $trailing = '';

            // Don't sweep trailing sentence punctuation into the URL.
            if (preg_match('/^(.*?)([.,!?;:]+)$/', $url, $tm)) {
                $url = $tm[1];
                $trailing = $tm[2];
            }

            return self::anchor($url, $url).$trailing;
        }, $escapedText);
    }

    private static function anchor(string $url, string $label): string
    {
        return '<a href="'.$url.'" target="_blank" rel="noopener noreferrer" style="color:#4f46e5; text-decoration:underline; font-weight:500;">'.$label.'</a>';
    }
}
