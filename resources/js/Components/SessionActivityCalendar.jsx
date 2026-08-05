import { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeader from '@/Components/SectionHeader';

/**
 * "Session Activity" widget: two month grids of daily squares shown side by
 * side, one per day, colored by how many sessions started that day. Modeled
 * after Claude Status's Uptime history grid (status.claude.com -> Uptime),
 * including its inline "click a day" popover (rather than a modal dialog) -
 * adapted from "% uptime that day" to "sessions that day" since that's the
 * data this app actually has. Reused for both the per-user dashboard card
 * (title="Session Activity") and the admin dashboard's site-wide card
 * (title="Website Sessions") - only the data and title differ.
 *
 * The day popover deliberately only shows a count, not a per-session
 * breakdown (times, device, browser) - that level of detail belongs to
 * Settings > Logged in devices (or, for admins, a user's own login history),
 * not a quick calendar drilldown.
 *
 * Chunking is sequential (7 days per row starting from the 1st), not
 * weekday-aligned, matching the reference widget rather than a calendar-week
 * grid like CalendarView elsewhere on the dashboard.
 */

function levelForCount(count) {
    if (!count) return 0;
    if (count <= 1) return 1;
    if (count <= 3) return 2;
    return 3;
}

const LEVEL_CLASSES = [
    'bg-gray-100 dark:bg-gray-700',
    'bg-indigo-200 dark:bg-indigo-900',
    'bg-indigo-400 dark:bg-indigo-700',
    'bg-indigo-600 dark:bg-indigo-500',
];

function toDateKey(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function StatPill({ label, value }) {
    return (
        <div className="rounded-md bg-gray-50 px-2.5 py-1.5 text-center dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        </div>
    );
}

// Inline popover shown under the clicked square, styled after
// status.claude.com's uptime-day tooltip (date header, pointer triangle)
// instead of a full modal dialog - this is a lightweight drilldown, not a
// form or a flow that needs a dedicated modal.
function DayPopover({ day, style, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        const handleKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    if (!day) return null;
    const { date, count } = day;

    return (
        <div ref={ref} style={style} className="absolute z-20 w-52 max-w-[calc(100vw-3rem)]">
            <div className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
            <div className="relative flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3.5 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {count} session{count === 1 ? '' : 's'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// One month's grid, shown twice side by side by the parent card. Each grid
// owns its own popover state/positioning so clicking a day in either month
// works independently.
function MonthGrid({ monthDate, sessionsByDay, today }) {
    const containerRef = useRef(null);
    const [selectedDay, setSelectedDay] = useState(null);
    const [popoverStyle, setPopoverStyle] = useState(null);

    useEffect(() => { setSelectedDay(null); }, [monthDate]);

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = useMemo(
        () => Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
        [year, month, daysInMonth]
    );
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

    const countFor = (d) => sessionsByDay[toDateKey(d)] ?? 0;
    const isToday = (d) => toDateKey(d) === toDateKey(today);

    const openDay = (e, d) => {
        const squareRect = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 208; // w-52
        let left = squareRect.left - containerRect.left + squareRect.width / 2 - 24;
        left = Math.max(0, Math.min(left, containerRect.width - popoverWidth));
        const top = squareRect.bottom - containerRect.top + 10;

        const key = toDateKey(d);
        const alreadyOpen = selectedDay && toDateKey(selectedDay.date) === key;
        if (alreadyOpen) {
            setSelectedDay(null);
            return;
        }
        setPopoverStyle({ top, left });
        setSelectedDay({ date: d, count: countFor(d) });
    };

    return (
        <div>
            <p className="mb-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <div ref={containerRef} className="relative space-y-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex justify-center gap-1">
                        {row.map((d) => {
                            const isFuture = d > today;
                            const count = countFor(d);
                            return (
                                <button
                                    key={d.getTime()}
                                    type="button"
                                    disabled={isFuture}
                                    onClick={(e) => openDay(e, d)}
                                    title={isFuture ? undefined : `${d.toLocaleDateString(undefined, { dateStyle: 'medium' })}: ${count} session${count === 1 ? '' : 's'}`}
                                    className={`h-6 w-6 rounded-sm transition-transform sm:h-7 sm:w-7 ${
                                        isFuture
                                            ? 'cursor-default bg-gray-50 dark:bg-gray-800/50'
                                            : `${LEVEL_CLASSES[levelForCount(count)]} hover:scale-110 hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-500`
                                    } ${isToday(d) && !isFuture ? 'ring-1 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                                />
                            );
                        })}
                    </div>
                ))}

                {selectedDay && <DayPopover day={selectedDay} style={popoverStyle} onClose={() => setSelectedDay(null)} />}
            </div>
        </div>
    );
}

export default function SessionActivityCalendar({ title = 'Session Activity', sessionsByDay = {}, offset = 0, onNavigate }) {
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

    const newerMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() - offset, 1), [offset, today]);
    const olderMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() - offset - 1, 1), [offset, today]);

    // Max/Min/Avg cover every elapsed day across both visible months, not
    // just one - a single-month view would make the pills jump around
    // depending on which pair happens to be on screen.
    const elapsedCounts = useMemo(() => {
        const counts = [];
        [olderMonth, newerMonth].forEach((monthDate) => {
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(year, month, i);
                if (d <= today) counts.push(sessionsByDay[toDateKey(d)] ?? 0);
            }
        });
        return counts;
    }, [olderMonth, newerMonth, sessionsByDay, today]);

    const maxSessions = elapsedCounts.length ? Math.max(...elapsedCounts) : 0;
    const minSessions = elapsedCounts.length ? Math.min(...elapsedCounts) : 0;
    const avgSessions = elapsedCounts.length ? (elapsedCounts.reduce((a, b) => a + b, 0) / elapsedCounts.length).toFixed(1) : '0.0';

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title={title}
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigate(offset + 2)}
                        aria-label="Previous months"
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        ←
                    </button>
                    <span className="min-w-40 text-center text-sm text-gray-600 dark:text-gray-400">
                        {olderMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {newerMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => onNavigate(Math.max(0, offset - 2))}
                        disabled={offset === 0}
                        aria-label="Next months"
                        className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        →
                    </button>
                </div>
            </SectionHeader>

            <div className="mb-4 grid grid-cols-3 gap-2">
                <StatPill label="Max / day" value={maxSessions} />
                <StatPill label="Min / day" value={minSessions} />
                <StatPill label="Avg / day" value={avgSessions} />
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <MonthGrid monthDate={olderMonth} sessionsByDay={sessionsByDay} today={today} />
                <MonthGrid monthDate={newerMonth} sessionsByDay={sessionsByDay} today={today} />
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                <span>Less</span>
                {LEVEL_CLASSES.map((cls, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
