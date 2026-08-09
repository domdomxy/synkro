import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SectionHeader from '@/Components/SectionHeader';
import Avatar from '@/Components/Avatar';

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
 * The day popover deliberately only shows that day's own count, plus two
 * min/max/avg breakdowns scoped to that one day: how many sessions there
 * were (by user for the admin's site-wide card - who logged in the most,
 * and how sessions split across everyone active that day; by device type
 * for the per-user card - which device was used most, and how sessions
 * split across whatever devices this person logged in from that day,
 * since "top user" is meaningless once already scoped to one person), and
 * how long those sessions actually lasted (durationStatsByDay - count and
 * length are independent: a day can have few long sessions or many short
 * ones). Not a per-session breakdown (times, device, browser) beyond that
 * - that level of detail belongs to Settings > Logged in devices (or, for
 * admins, a user's own login history), not a quick calendar drilldown.
 *
 * Chunking is sequential (7 days per row starting from the 1st), not
 * weekday-aligned, matching the reference widget rather than a calendar-week
 * grid like CalendarView elsewhere on the dashboard.
 *
 * Max/Min/Avg are computed per visible month (not pooled across both), so
 * a quiet month doesn't get its numbers dragged up by a busy one sitting
 * next to it - each MonthGrid owns its own trio.
 */

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS_BACK = 5;
const POPOVER_WIDTH = 208; // w-52
const TRIANGLE_SIZE = 12; // h-3 w-3

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

// Compact "1h 4m" / "12m" / "45s" formatting for the day popover's session-
// length pills - seconds are the unit coming out of the backend, but nobody
// wants to read "3845s".
function formatDuration(seconds) {
    if (seconds == null) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// Compact variant used in the day popover's Min/Avg/Max row, where space is
// tighter than a full card-level stat pill.
function MiniStatPill({ label, value }) {
    return (
        <div className="rounded bg-gray-50 px-1.5 py-1 text-center dark:bg-gray-900/40">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
        </div>
    );
}

// One month's own Max/Min/Avg, shown as a compact inline row under that
// month's label instead of a single pooled trio for the whole card - see
// file header.
function MonthStatsRow({ stats }) {
    return (
        <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <span>Max <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.max}</span></span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>Min <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.min}</span></span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>Avg <span className="font-semibold text-gray-700 dark:text-gray-300">{stats.avg}</span></span>
        </div>
    );
}

// Inline popover shown next to the clicked square, styled after
// status.claude.com's uptime-day tooltip (date header, pointer triangle)
// instead of a full modal dialog - this is a lightweight drilldown, not a
// form or a flow that needs a dedicated modal.
//
// Rendered via a portal into document.body and positioned with fixed
// coordinates computed from the clicked square's own bounding rect (rather
// than being absolutely positioned inside the month grid), so it can never
// get clipped by a card's bottom edge or overlap the legend/next section
// below it the way it did when it was confined to the grid's own box - the
// same class of fix already used for the task row's kebab menu. It also
// flips to open upward, and the pointer triangle flips with it, when there
// isn't room below the clicked square (e.g. the last row of a month).
// Small device-type glyphs for the personal calendar's "top device" row -
// the closest scoped-down equivalent of the admin popover's "top user"
// avatar, since a single user's own day obviously has no other people to
// show.
function DeviceIcon({ device }) {
    const paths = {
        Mobile: 'M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z',
        Tablet: 'M12 18h.01M6 21h12a1 1 0 001-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1v16a1 1 0 001 1z',
        Desktop: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    };
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={paths[device] ?? paths.Desktop} />
        </svg>
    );
}

function DayPopover({ day, anchorEl, onClose }) {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0, openUpward: false, triangleLeft: 24 });

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) onClose();
        };
        const handleKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose, anchorEl]);

    // Close on scroll/resize anywhere instead of trying to keep the
    // popover glued to a square that's moving under it.
    useEffect(() => {
        const close = () => onClose();
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [onClose]);

    useLayoutEffect(() => {
        if (!anchorEl) return;
        const squareRect = anchorEl.getBoundingClientRect();
        const height = ref.current?.offsetHeight ?? 0;
        const spaceBelow = window.innerHeight - squareRect.bottom;
        const spaceAbove = squareRect.top;
        const openUpward = spaceBelow < height + 16 && spaceAbove > spaceBelow;

        const squareCenter = squareRect.left + squareRect.width / 2;
        let left = squareCenter - 24;
        left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8));
        const top = openUpward ? squareRect.top - height - 10 : squareRect.bottom + 10;

        // The popover's left edge gets clamped to stay on-screen, so the
        // triangle can't just sit at a fixed offset - it needs to track the
        // clicked square's actual center relative to wherever the popover
        // ended up, then get nudged in from the popover's rounded corners.
        let triangleLeft = squareCenter - left - TRIANGLE_SIZE / 2;
        triangleLeft = Math.max(10, Math.min(triangleLeft, POPOVER_WIDTH - TRIANGLE_SIZE - 10));

        setPosition({ top, left, openUpward, triangleLeft });
    }, [anchorEl, day]);

    if (!day) return null;
    const { date, count, dayStats, duration } = day;
    const topUser = dayStats?.top_user;
    const topDevice = dayStats?.top_device;

    return createPortal(
        <div ref={ref} style={{ position: 'fixed', top: position.top, left: position.left }} className="z-50 w-52">
            <div
                style={{ left: position.triangleLeft }}
                className={`absolute h-3 w-3 rotate-45 border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 ${
                    position.openUpward ? '-bottom-1.5 border-b border-r' : '-top-1.5 border-l border-t'
                }`}
            />
            <div className="relative flex flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3.5 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-2">
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

                {topUser && (
                    // Admin view: who logged in the most that day.
                    <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-700">
                        <Avatar user={topUser} size="h-7 w-7" />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{topUser.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                Most active · {dayStats.top_count} session{dayStats.top_count === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                )}

                {topDevice && (
                    // Personal view: no other people to break down, so the
                    // device type used most that day is the closest scoped-
                    // down equivalent of "top user".
                    <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-700">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-400">
                            <DeviceIcon device={topDevice} />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{topDevice}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                Most active · {dayStats.top_count} session{dayStats.top_count === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                )}

                {dayStats && (
                    // Min/max/avg sessions per user (admin) or per device
                    // (personal), across whoever/whatever was active that
                    // specific day.
                    <div>
                        <p className="mb-1.5 text-[10px] text-gray-400 dark:text-gray-500">Sessions {topUser ? 'per user' : topDevice ? 'per device' : ''}</p>
                        <div className="grid grid-cols-3 gap-1.5">
                            <MiniStatPill label="Min" value={dayStats.min} />
                            <MiniStatPill label="Avg" value={dayStats.avg} />
                            <MiniStatPill label="Max" value={dayStats.max} />
                        </div>
                    </div>
                )}

                {duration && (
                    // How long sessions that started this day actually
                    // lasted, not just how many there were - a day can have
                    // few, long sessions or many, short ones, and the count
                    // above can't tell those apart. Only sessions that have
                    // already ended contribute (see durationStatsByDay), so
                    // this can legitimately be absent even when `count` and
                    // `dayStats` aren't, e.g. a session still in progress.
                    <div className="border-t border-gray-100 pt-2.5 dark:border-gray-700">
                        <p className="mb-1.5 text-[10px] text-gray-400 dark:text-gray-500">Session length</p>
                        <div className="grid grid-cols-3 gap-1.5">
                            <MiniStatPill label="Min" value={formatDuration(duration.min)} />
                            <MiniStatPill label="Avg" value={formatDuration(duration.avg)} />
                            <MiniStatPill label="Max" value={formatDuration(duration.max)} />
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

// One month's grid, shown twice side by side by the parent card. Each grid
// owns its own popover state so clicking a day in either month works
// independently; positioning itself is handled by DayPopover via portal.
function MonthGrid({ monthDate, sessionsByDay, userBreakdownByDay, durationByDay, today }) {
    const [selectedDay, setSelectedDay] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => { setSelectedDay(null); setAnchorEl(null); }, [monthDate]);

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

    // This month's own Max/Min/Avg, over elapsed days only (future days
    // within the current month don't count against it).
    const monthStats = useMemo(() => {
        const counts = days.filter((d) => d <= today).map((d) => countFor(d));
        if (!counts.length) return { max: 0, min: 0, avg: 0 };
        return {
            max: Math.max(...counts),
            min: Math.min(...counts),
            avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
        };
    }, [days, sessionsByDay, today]);

    const openDay = (e, d) => {
        const key = toDateKey(d);
        const alreadyOpen = selectedDay && toDateKey(selectedDay.date) === key;
        if (alreadyOpen) {
            setSelectedDay(null);
            setAnchorEl(null);
            return;
        }
        setAnchorEl(e.currentTarget);
        setSelectedDay({ date: d, count: countFor(d), dayStats: userBreakdownByDay?.[key], duration: durationByDay?.[key] });
    };

    return (
        <div>
            <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
            <MonthStatsRow stats={monthStats} />
            <div className="space-y-1">
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
            </div>

            {selectedDay && (
                <DayPopover day={selectedDay} anchorEl={anchorEl} onClose={() => { setSelectedDay(null); setAnchorEl(null); }} />
            )}
        </div>
    );
}

// "Filters" panel for the Month/Year picker in the card header. Rendered
// via a portal into document.body with fixed coordinates measured off the
// trigger button's own rect, the same fix already applied to DayPopover
// above - the generic <Dropdown> component only positions itself with CSS
// (absolute + right-anchored to its own trigger) and a transform-based
// viewport nudge, which isn't enough once the header's "flex flex-wrap"
// pushes the trigger away from the card's right edge on narrow screens:
// a right-anchored panel wider than the space to the trigger's left then
// opens with its left edge past x=0, off-screen and unreachable, rather
// than clamped back on. Measuring the trigger and the panel directly and
// positioning with `fixed` sidesteps that instead of trying to patch the
// shared component's alignment math for this one edge case.
function FiltersPanel({ anchorEl, onClose, children }) {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target) && anchorEl && !anchorEl.contains(e.target)) onClose();
        };
        const handleKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose, anchorEl]);

    useLayoutEffect(() => {
        if (!anchorEl) return;

        const recalc = () => {
            const triggerRect = anchorEl.getBoundingClientRect();
            const panelWidth = ref.current?.offsetWidth ?? 0;
            const panelHeight = ref.current?.offsetHeight ?? 0;
            const margin = 8;

            // Right-align to the trigger like the panel used to, but clamp
            // between the margins - never let either edge land off-screen,
            // regardless of where the trigger itself ended up.
            let left = triggerRect.right - panelWidth;
            left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            const openUpward = spaceBelow < panelHeight + 16 && spaceAbove > spaceBelow;
            const top = openUpward ? triggerRect.top - panelHeight - 8 : triggerRect.bottom + 8;

            setPosition({ top, left, ready: true });
        };

        recalc();
        window.addEventListener('resize', recalc);
        window.addEventListener('scroll', recalc, true);

        let resizeObserver;
        if (ref.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(recalc);
            resizeObserver.observe(ref.current);
        }

        return () => {
            window.removeEventListener('resize', recalc);
            window.removeEventListener('scroll', recalc, true);
            resizeObserver?.disconnect();
        };
    }, [anchorEl]);

    return createPortal(
        <div
            ref={ref}
            style={{ position: 'fixed', top: position.top, left: position.left, visibility: position.ready ? 'visible' : 'hidden' }}
            className="z-50 w-max max-w-[calc(100vw-1rem)] space-y-3 rounded-xl border border-gray-100 bg-white p-3 shadow-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10"
        >
            {children}
        </div>,
        document.body
    );
}

export default function SessionActivityCalendar({ title = 'Session Activity', sessionsByDay = {}, offset = 0, onNavigate, userBreakdownByDay, durationByDay }) {
    const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

    const newerMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() - offset, 1), [offset, today]);
    const olderMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth() - offset - 1, 1), [offset, today]);

    // The month/year filter always targets the newer (right-hand) month of
    // the pair - the older one just follows a month behind, same as the
    // arrow buttons already did.
    const monthsBetween = (year, monthIndex) => (today.getFullYear() * 12 + today.getMonth()) - (year * 12 + monthIndex);
    const jumpTo = (year, monthIndex) => onNavigate(Math.max(0, monthsBetween(year, monthIndex)));

    const selectedYear = newerMonth.getFullYear();
    const selectedMonthIndex = newerMonth.getMonth();
    const years = useMemo(
        () => Array.from({ length: YEARS_BACK + 1 }, (_, i) => today.getFullYear() - YEARS_BACK + i),
        [today]
    );
    // Can't jump to a month later than the current one - the grid has
    // nothing to show for days that haven't happened yet.
    const monthOptions = MONTH_NAMES
        .map((name, i) => ({ name, i }))
        .filter(({ i }) => selectedYear < today.getFullYear() || i <= today.getMonth());

    const handleMonthChange = (i) => jumpTo(selectedYear, i);
    const handleYearChange = (newYear) => {
        const clampedMonth = newYear === today.getFullYear() ? Math.min(selectedMonthIndex, today.getMonth()) : selectedMonthIndex;
        jumpTo(newYear, clampedMonth);
    };

    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersTriggerRef = useRef(null);

    // "Filters" trigger + panel, styled after the Activity chart's
    // ChartControlsMenu (a single button summarizing the current selection
    // that expands into labeled sections) instead of two permanently
    // open <select> elements competing with the card title for header
    // space - see ChartControlsMenu for the pattern this mirrors.
    const pillClass = (active) =>
        `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            active
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`;

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
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button
                        onClick={() => onNavigate(offset + 2)}
                        aria-label="Previous months"
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        ref={filtersTriggerRef}
                        onClick={() => setFiltersOpen((v) => !v)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 6h18M9 18h6" />
                        </svg>
                        Filters
                        <span className="hidden text-gray-400 dark:text-gray-500 sm:inline">
                            · {MONTH_NAMES[selectedMonthIndex]} {selectedYear}
                        </span>
                    </button>
                    {filtersOpen && (
                        <FiltersPanel anchorEl={filtersTriggerRef.current} onClose={() => setFiltersOpen(false)}>
                            <div>
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Month</p>
                                <div className="flex max-w-[15rem] flex-wrap items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
                                    {monthOptions.map(({ name, i }) => (
                                        <button key={i} type="button" onClick={() => handleMonthChange(i)} className={pillClass(i === selectedMonthIndex)}>
                                            {name.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Year</p>
                                <div className="flex flex-wrap items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
                                    {years.map((y) => (
                                        <button key={y} type="button" onClick={() => handleYearChange(y)} className={pillClass(y === selectedYear)}>
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </FiltersPanel>
                    )}
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

            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <MonthGrid monthDate={olderMonth} sessionsByDay={sessionsByDay} userBreakdownByDay={userBreakdownByDay} durationByDay={durationByDay} today={today} />
                <MonthGrid monthDate={newerMonth} sessionsByDay={sessionsByDay} userBreakdownByDay={userBreakdownByDay} durationByDay={durationByDay} today={today} />
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
