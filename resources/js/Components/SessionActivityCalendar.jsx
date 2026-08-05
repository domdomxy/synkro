import { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeader from '@/Components/SectionHeader';

/**
 * "Session Activity" widget for the user dashboard: a single-month grid of
 * daily squares, one per day, colored by how many sessions the user had
 * that day. Modeled after Claude Status's Uptime history grid
 * (status.claude.com -> Uptime), including its inline "click a day" popover
 * (rather than a modal dialog) - adapted from "% uptime that day" to
 * "sessions that day" since that's the data this app actually has.
 *
 * Chunking is sequential (7 days per row starting from the 1st), not
 * weekday-aligned, matching the reference widget rather than a calendar-week
 * grid like CalendarView elsewhere on this page.
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

function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return null;
    if (seconds < 60) return 'less than a minute';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours === 0) return `${remMinutes}m`;
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { timeStyle: 'short' });
}

function StatPill({ label, value }) {
    return (
        <div className="rounded-md bg-gray-50 px-2.5 py-1.5 text-center dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        </div>
    );
}

function DeviceIcon({ device, className }) {
    const isMobile = device === 'Mobile' || device === 'Tablet';
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {isMobile ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            )}
        </svg>
    );
}

function SessionRow({ s }) {
    const statusLabel = s.ongoing ? 'Still active' : s.expired ? 'Expired (no logout recorded)' : `Lasted ${formatDuration(s.duration_seconds)}`;
    const statusColor = s.ongoing
        ? 'text-green-600 dark:text-green-400'
        : s.expired
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-gray-400 dark:text-gray-500';

    return (
        <li className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                <DeviceIcon device={s.device} className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                    {formatTime(s.start)} – {s.ongoing || s.expired ? 'now' : formatTime(s.end)}
                </p>
                <p className={`text-xs ${statusColor}`}>{statusLabel}</p>
                {(s.browser || s.device || s.location) && (
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                        {[s.browser, s.device, s.location].filter(Boolean).join(' · ')}
                    </p>
                )}
            </div>
        </li>
    );
}

// Inline popover shown under the clicked square, styled after status.claude.com's
// uptime-day tooltip (date header, small-caps body, pointer triangle) instead of a
// full modal dialog - this is a lightweight drilldown, not a form or a flow that
// needs a dedicated modal. The session list scrolls internally past a handful of
// entries so a busy day never pushes the close button (or the rest of the page)
// off screen.
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
    const { date, sessions } = day;
    const activeCount = sessions.filter((s) => s.ongoing).length;

    return (
        <div ref={ref} style={style} className="absolute z-20 w-80 max-w-[calc(100vw-3rem)]">
            <div className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
            <div className="relative flex max-h-80 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-100 p-4 pb-3 dark:border-gray-700">
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            {sessions.length} session{sessions.length === 1 ? '' : 's'}
                            {activeCount > 0 && <span className="text-green-600 dark:text-green-400"> · {activeCount} active</span>}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {sessions.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No sessions recorded on this day.</p>
                ) : (
                    <ul className="min-h-0 divide-y divide-gray-100 overflow-y-auto px-4 dark:divide-gray-700">
                        {sessions.map((s, i) => <SessionRow key={i} s={s} />)}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function SessionActivityCalendar({ sessionsByDay = {}, offset = 0, onNavigate }) {
    const [selectedDay, setSelectedDay] = useState(null);
    const [popoverStyle, setPopoverStyle] = useState(null);
    const containerRef = useRef(null);
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

    // Collapse the popover whenever the month changes so it can't point at a
    // square from the month that's no longer on screen.
    useEffect(() => { setSelectedDay(null); }, [offset]);

    const monthDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() - offset, 1), [offset, today]);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = useMemo(
        () => Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
        [year, month, daysInMonth]
    );
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

    const countFor = (d) => sessionsByDay[toDateKey(d)]?.count ?? 0;
    const elapsedDays = days.filter((d) => d <= today);
    const elapsedCounts = elapsedDays.map(countFor);

    const totalSessions = elapsedCounts.reduce((a, b) => a + b, 0);
    const activeDays = elapsedCounts.filter((c) => c > 0).length;
    const activePct = elapsedDays.length ? Math.round((activeDays / elapsedDays.length) * 100) : 0;
    const maxSessions = elapsedCounts.length ? Math.max(...elapsedCounts) : 0;
    const minSessions = elapsedCounts.length ? Math.min(...elapsedCounts) : 0;
    const avgSessions = elapsedCounts.length ? (totalSessions / elapsedCounts.length).toFixed(1) : '0.0';
    const busiestDay = elapsedDays.reduce((best, d) => (countFor(d) > countFor(best ?? d) ? d : best), null);

    const openDay = (e, d) => {
        const squareRect = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 320; // w-80
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
        setSelectedDay({ date: d, sessions: sessionsByDay[key]?.sessions ?? [] });
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title="Session Activity"
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigate(offset + 1)}
                        aria-label="Previous month"
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        ←
                    </button>
                    <span className="min-w-32 text-center text-sm text-gray-600 dark:text-gray-400">
                        {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => onNavigate(Math.max(0, offset - 1))}
                        disabled={offset === 0}
                        aria-label="Next month"
                        className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        →
                    </button>
                </div>
            </SectionHeader>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatPill label="Total" value={totalSessions} />
                <StatPill label="Max / day" value={maxSessions} />
                <StatPill label="Min / day" value={minSessions} />
                <StatPill label="Avg / day" value={avgSessions} />
            </div>

            <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {busiestDay && countFor(busiestDay) > 0
                        ? `Busiest: ${busiestDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${countFor(busiestDay)})`
                        : 'Click a day for details'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{activePct}% active</p>
            </div>
            <div ref={containerRef} className="relative mt-2 space-y-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex gap-1">
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
                                    }`}
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
