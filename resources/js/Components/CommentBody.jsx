import { useState } from 'react';
import Linkify from '@/Components/Linkify';

// Comments over this length get collapsed behind a "Show more" toggle so a long
// comment doesn't dominate the thread. Chosen to be a couple of sentences, well
// under the 2000 char max a comment can hold.
const TRUNCATE_LENGTH = 300;

export default function CommentBody({ text }) {
    const [expanded, setExpanded] = useState(false);

    const str = String(text ?? '');
    const isLong = str.length > TRUNCATE_LENGTH;
    const display = isLong && !expanded ? str.slice(0, TRUNCATE_LENGTH).trimEnd() + '…' : str;

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-900 dark:text-gray-100">
                <Linkify text={display} />
            </p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((current) => !current)}
                    className="mt-1 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
}
