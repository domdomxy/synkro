// Hero illustration for the Error page (resources/js/Pages/Error.jsx): a
// small "task card" character reacting to whatever went wrong, tucked
// behind a big bold status number - the numeral-plus-mascot layout common
// to 404 pages, but the mascot is Synkro's own card, not a generic robot
// or animal, so it still reads as this app's error page.
//
// Deliberately drawn with fully-opaque fill/stroke utilities (fill-*,
// stroke-*, not currentColor-through-a-<pattern> or very low opacity
// washes) so it stays clearly visible on every theme, including the
// black theme, where anything under ~15% opacity all but disappears
// against a true #000 background.
const MOOD = {
    // 403 - blocked
    worried: {
        eyes: (
            <>
                <circle cx="62" cy="82" r="5" className="fill-current" />
                <circle cx="98" cy="82" r="5" className="fill-current" />
            </>
        ),
        brows: (
            <>
                <path d="M52 68l16 8" strokeLinecap="round" />
                <path d="M108 68l-16 8" strokeLinecap="round" />
            </>
        ),
        mouth: <path d="M64 108q16-10 32 0" strokeLinecap="round" />,
    },
    // 404 - confused
    confused: {
        eyes: (
            <>
                <circle cx="62" cy="82" r="5" className="fill-current" />
                <circle cx="98" cy="82" r="5" className="fill-current" />
            </>
        ),
        brows: (
            <>
                <path d="M52 70q10-6 18 0" strokeLinecap="round" />
                <path d="M90 66q10 4 18 8" strokeLinecap="round" />
            </>
        ),
        mouth: <ellipse cx="80" cy="110" rx="9" ry="7" />,
    },
    // 419 - drowsy
    sleepy: {
        eyes: (
            <>
                <path d="M54 82q8 6 16 0" strokeLinecap="round" />
                <path d="M90 82q8 6 16 0" strokeLinecap="round" />
            </>
        ),
        brows: null,
        mouth: <path d="M68 108q12 6 24 0" strokeLinecap="round" />,
    },
    // 429 - overwhelmed
    dizzy: {
        eyes: (
            <>
                <path d="M56 76l12 12M68 76l-12 12" strokeLinecap="round" />
                <path d="M92 76l12 12M104 76l-12 12" strokeLinecap="round" />
            </>
        ),
        brows: null,
        mouth: <ellipse cx="80" cy="110" rx="10" ry="6" />,
    },
    // 500 - shocked
    shocked: {
        eyes: (
            <>
                <path d="M56 76l12 12M68 76l-12 12" strokeLinecap="round" />
                <path d="M92 76l12 12M104 76l-12 12" strokeLinecap="round" />
            </>
        ),
        brows: (
            <>
                <path d="M50 66l20 6" strokeLinecap="round" />
                <path d="M110 66l-20 6" strokeLinecap="round" />
            </>
        ),
        mouth: <path d="M66 104l6 8 6-6 6 8 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
    },
    // 503 - asleep
    sleeping: {
        eyes: (
            <>
                <path d="M54 83q8 5 16 0" strokeLinecap="round" />
                <path d="M90 83q8 5 16 0" strokeLinecap="round" />
            </>
        ),
        brows: null,
        mouth: <path d="M70 108q10 4 20 0" strokeLinecap="round" />,
    },
};

export default function ErrorMascot({ mood = 'confused', className = '' }) {
    const face = MOOD[mood] ?? MOOD.confused;

    return (
        <svg viewBox="0 0 160 190" className={className}>
            {/* the card's dropped shadow, a second offset copy - the cheap
                "sticker" trick that gives it a little pop off the page */}
            <rect
                x="18" y="26" width="124" height="140" rx="18"
                transform="rotate(-8 80 96)"
                className="fill-gray-900/10 dark:fill-black/40"
            />

            <g transform="rotate(-4 80 92)">
                <rect
                    x="14" y="18" width="124" height="140" rx="18"
                    className="fill-white stroke-gray-700 dark:fill-gray-800 dark:stroke-gray-400"
                    strokeWidth="3.5"
                />

                {/* peeled corner */}
                <path
                    d="M114 18h24v24c-14 1-24-9-24-24z"
                    className="fill-gray-50 stroke-gray-700 dark:fill-gray-700 dark:stroke-gray-400"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />

                {/* a couple lines of "content" so it still reads as a task card */}
                <line x1="34" y1="130" x2="90" y2="130" strokeWidth="3" strokeLinecap="round" className="stroke-gray-300 dark:stroke-gray-600" />
                <line x1="34" y1="144" x2="70" y2="144" strokeWidth="3" strokeLinecap="round" className="stroke-gray-300 dark:stroke-gray-600" />

                {/* face */}
                <g strokeWidth="3.5" className="stroke-gray-700 dark:stroke-gray-200" fill="none">
                    {face.brows}
                </g>
                {/* both stroke-* (for the X/curve-shaped eyes, which are plain
                    paths with no color of their own) and text-* (so the
                    fill-current circles used by a couple of the other moods
                    pick up the same color via currentColor) - the two moods
                    use different SVG primitives so both need covering */}
                <g className="stroke-indigo-500 text-indigo-500 dark:stroke-indigo-400 dark:text-indigo-400" strokeWidth="3.5" fill="none">
                    {face.eyes}
                </g>
                <g strokeWidth="3.5" className="stroke-gray-700 dark:stroke-gray-200" fill="none" strokeLinejoin="round">
                    {face.mouth}
                </g>
            </g>
        </svg>
    );
}
