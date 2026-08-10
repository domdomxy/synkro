// Ambient background for the Error page (resources/js/Pages/Error.jsx):
// a faint sketch of a task board - the same card-and-connector language
// Synkro's own board uses for task dependencies - with one connector
// snapped right where the error content sits. The idea being sketched:
// this page exists at the spot where a link in the board broke.
//
// Two layers: a fine dot grid (blueprint-paper texture, `dotClass`) and
// the card/connector line art (`lineClass`), plus one connector rendered
// in the status tone so the background visibly points at the badge above.
export default function ErrorBackground({ dotClass, lineClass, toneClass }) {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <pattern id="error-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
                    </pattern>
                </defs>
                <rect width="1440" height="900" fill="url(#error-dot-grid)" className={dotClass} />

                <g className={lineClass} fill="none" stroke="currentColor" strokeWidth="2">
                    {/* card: top-left */}
                    <g transform="translate(110,90)">
                        <rect width="200" height="118" rx="12" />
                        <line x1="22" y1="30" x2="130" y2="30" strokeWidth="3" strokeLinecap="round" />
                        <line x1="22" y1="52" x2="160" y2="52" strokeLinecap="round" />
                        <line x1="22" y1="70" x2="110" y2="70" strokeLinecap="round" />
                        <rect x="22" y="90" width="14" height="14" rx="4" />
                    </g>

                    {/* card: top-right */}
                    <g transform="translate(1060,60)">
                        <rect width="210" height="126" rx="12" />
                        <line x1="22" y1="32" x2="140" y2="32" strokeWidth="3" strokeLinecap="round" />
                        <line x1="22" y1="55" x2="170" y2="55" strokeLinecap="round" />
                        <rect x="22" y="78" width="14" height="14" rx="4" />
                        <line x1="46" y1="85" x2="120" y2="85" strokeLinecap="round" />
                    </g>

                    {/* card: lower-left */}
                    <g transform="translate(70,600)">
                        <rect width="190" height="112" rx="12" />
                        <line x1="20" y1="28" x2="120" y2="28" strokeWidth="3" strokeLinecap="round" />
                        <line x1="20" y1="50" x2="150" y2="50" strokeLinecap="round" />
                        <rect x="20" y="72" width="14" height="14" rx="4" />
                        <line x1="44" y1="79" x2="100" y2="79" strokeLinecap="round" />
                    </g>

                    {/* card: bottom-right */}
                    <g transform="translate(1120,660)">
                        <rect width="200" height="116" rx="12" />
                        <line x1="22" y1="30" x2="130" y2="30" strokeWidth="3" strokeLinecap="round" />
                        <line x1="22" y1="52" x2="160" y2="52" strokeLinecap="round" />
                        <line x1="22" y1="74" x2="100" y2="74" strokeLinecap="round" />
                    </g>

                    {/* card: far bottom-left, smaller */}
                    <g transform="translate(260,790)">
                        <rect width="150" height="88" rx="10" />
                        <line x1="18" y1="24" x2="95" y2="24" strokeWidth="3" strokeLinecap="round" />
                        <line x1="18" y1="44" x2="120" y2="44" strokeLinecap="round" />
                    </g>

                    {/* dependency lines between the intact cards, routed around the
                        centered content rather than through it */}
                    <path d="M310,150 C420,140 470,260 460,420" strokeDasharray="2 10" strokeLinecap="round" />
                    <path d="M1060,130 C900,160 840,300 760,360" strokeDasharray="2 10" strokeLinecap="round" />
                    <path d="M165,600 C220,500 300,470 380,460" strokeDasharray="2 10" strokeLinecap="round" />
                    <path d="M1220,660 C1080,600 980,560 900,500" strokeDasharray="2 10" strokeLinecap="round" />
                    <path d="M335,790 C400,700 460,600 500,540" strokeDasharray="2 10" strokeLinecap="round" />
                </g>

                {/* the snapped connector: reaches toward the centered card above
                    and stops mid-air with a small broken-link mark, in the
                    status tone so it visibly ties the sketch to the badge */}
                <g className={toneClass} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M700,80 C660,180 640,260 630,330" strokeDasharray="2 10" />
                    <path d="M622,352 l10,14 l-14,8 l10,14" />
                </g>
            </svg>
        </div>
    );
}
