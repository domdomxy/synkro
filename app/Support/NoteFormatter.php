<?php

namespace App\Support;

class NoteFormatter
{
    /**
     * Render a free-form note (one point per line, optional **bold** markers)
     * as safe HTML: a bullet list for multiple lines, a single paragraph
     * otherwise. All user input is escaped before any HTML is added.
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

    private static function formatLine(string $line): string
    {
        $escaped = e($line);

        return preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $escaped);
    }
}
