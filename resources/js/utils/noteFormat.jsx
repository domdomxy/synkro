// Shared helpers for rendering free-form reminder/notification notes that may
// contain multiple lines (one point per line) and **bold** segments.

import CopyableId from '@/Components/CopyableId';

// Feedback tracking IDs look like CWK-BOCA-3UF (see Feedback::tracking_id).
const TRACKING_ID_PATTERN = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;

export function noteLines(note) {
    if (!note) return [];
    return note
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

// Splits a single line on **bold** markers and returns an array of React nodes.
export function noteBoldSegments(line, boldClassName = 'font-semibold text-gray-700 dark:text-gray-200') {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== '');
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
                <strong key={i} className={boldClassName}>
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

// Same as noteBoldSegments, but any bold segment that's shaped like a
// feedback tracking ID also gets a small copy-to-clipboard button next to
// it, since admins often want to grab the ID straight from a log line.
export function noteBoldSegmentsWithCopy(line, boldClassName = 'font-semibold text-gray-700 dark:text-gray-200') {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== '');
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            const text = part.slice(2, -2);
            if (TRACKING_ID_PATTERN.test(text)) {
                return <CopyableId key={i} id={text} className={boldClassName} />;
            }
            return (
                <strong key={i} className={boldClassName}>
                    {text}
                </strong>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

// Renders a note as a bullet list when it has multiple lines, or a single
// paragraph otherwise. Each line supports **bold** segments.
export function NoteList({ note, className = '', itemClassName = '' }) {
    const lines = noteLines(note);
    if (lines.length === 0) return null;

    if (lines.length === 1) {
        return <p className={className}>{noteBoldSegments(lines[0])}</p>;
    }

    return (
        <ul className={`list-disc space-y-1 pl-4 ${className}`}>
            {lines.map((line, i) => (
                <li key={i} className={itemClassName}>
                    {noteBoldSegments(line)}
                </li>
            ))}
        </ul>
    );
}

// Flat, single-line preview for collapsed/compact contexts: strips bold
// markers and joins multiple lines with a bullet separator.
export function notePreview(note, maxChars = 120) {
    const text = noteLines(note)
        .map((line) => line.replace(/\*\*/g, ''))
        .join(' • ');
    return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
}
