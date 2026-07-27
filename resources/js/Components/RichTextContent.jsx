import { forwardRef, useMemo } from 'react';
import useIsDarkMode from '@/hooks/useIsDarkMode';
import { adjustRichTextColors } from '@/utils/richTextColor';

/**
 * Renders stored rich-text HTML (RichTextEditor output - task/project descriptions, activity-log
 * diffs, etc.) via dangerouslySetInnerHTML, first adjusting any inline text colors that would be
 * unreadable against the currently active theme (e.g. near-black text picked in light mode, viewed
 * after switching to dark - see utils/richTextColor.js). Drop-in replacement for a raw
 * `dangerouslySetInnerHTML={{ __html }}` on a rich-text field; every other prop (className, style,
 * onClick, etc.) is passed straight through to the wrapping element. Forwards its ref to that
 * element too, since some callers (e.g. TaskRow's truncation check) measure it directly.
 */
const RichTextContent = forwardRef(function RichTextContent({ html, fallback = null, as: Tag = 'div', ...props }, ref) {
    const isDark = useIsDarkMode();
    const content = html || fallback;
    const adjusted = useMemo(() => adjustRichTextColors(content, isDark), [content, isDark]);

    return <Tag ref={ref} {...props} dangerouslySetInnerHTML={{ __html: adjusted }} />;
});

export default RichTextContent;
