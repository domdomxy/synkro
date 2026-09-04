import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { localDateTimeToIso } from '@/utils/datetime';
import { NoteList, notePreview } from '@/utils/noteFormat';
import useConfirm from '@/hooks/useConfirm';
import StatCard from '@/Components/StatCard';
import Spinner from '@/Components/Spinner';
import FilterSelect from '@/Components/FilterSelect';
import StatusDonut from '@/Components/StatusDonut';
import ChartControlsMenu from '@/Components/ChartControlsMenu';
import DueSoonFilterMenu from '@/Components/DueSoonFilterMenu';
import SectionHeader from '@/Components/SectionHeader';
import ActivityChart from '@/Components/ActivityChart';
import SessionActivityCalendar from '@/Components/SessionActivityCalendar';
import { statusLabels, statusColors } from '@/utils/taskStatus';

const statIcons = {
    active: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    done: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    projects: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    review: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
};

function CalendarView({ tasks }) {
    const [calRange, setCalRange] = useState('month');
    const [baseDate, setBaseDate] = useState(() => new Date());

    const days = useMemo(() => {
        const start = new Date(baseDate);
        if (calRange === 'week') {
            start.setDate(start.getDate() - start.getDay());
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                return d;
            });
        } else if (calRange === 'month') {
            start.setDate(1);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            const arr = [];
            const cur = new Date(start);
            while (cur < end) {
                arr.push(new Date(cur));
                cur.setDate(cur.getDate() + 1);
            }
            return arr;
        } else {
            return Array.from({ length: 12 }, (_, i) => new Date(start.getFullYear(), i, 1));
        }
    }, [calRange, baseDate]);

    const navigate = (dir) => {
        const d = new Date(baseDate);
        if (calRange === 'week') d.setDate(d.getDate() + dir * 7);
        else if (calRange === 'month') d.setMonth(d.getMonth() + dir);
        else d.setFullYear(d.getFullYear() + dir);
        setBaseDate(d);
    };

    const tasksByDay = useMemo(() => {
        const map = {};
        tasks.forEach((task) => {
            if (!task.due_date) return;
            const key = calRange === 'year' ? new Date(task.due_date).getMonth() : new Date(task.due_date).toDateString();
            if (!map[key]) map[key] = [];
            map[key].push(task);
        });
        return map;
    }, [tasks, calRange]);

    const today = new Date().toDateString();
    const now = new Date();

    const rangeLabel = calRange === 'week'
        ? `Week of ${days[0]?.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
        : calRange === 'month'
        ? baseDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : baseDate.getFullYear().toString();

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title="Deadline Calendar"
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }
            >
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => navigate(-1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">←</button>
                    <span className="min-w-32 text-center text-sm text-gray-600 dark:text-gray-400">{rangeLabel}</span>
                    <button onClick={() => navigate(1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">→</button>
                    <div className="flex gap-1">
                        {['week', 'month', 'year'].map((r) => (
                            <button key={r} onClick={() => setCalRange(r)} className={`rounded-md px-2 py-1 text-xs capitalize ${calRange === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </SectionHeader>

            {calRange === 'year' ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {days.map((d, i) => {
                        const monthTasks = tasksByDay[i] ?? [];
                        const isCurrentMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                        return (
                            <div key={i} className={`rounded-md border p-2 transition-colors ${isCurrentMonth ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 dark:border-gray-700'}`}>
                                <p className={`text-xs font-medium ${isCurrentMonth ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>{d.toLocaleDateString(undefined, { month: 'short' })}</p>
                                {monthTasks.length > 0 && <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">{monthTasks.length} deadline{monthTasks.length > 1 ? 's' : ''}</p>}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {calRange === 'week' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <p key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</p>
                    ))}
                    {calRange === 'month' && ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <p key={i} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</p>
                    ))}
                    {calRange === 'month' && days[0] && Array.from({ length: days[0].getDay() }, (_, i) => <div key={`empty-${i}`} />)}
                    {days.map((d, i) => {
                        const key = d.toDateString();
                        const dayTasks = tasksByDay[key] ?? [];
                        const isToday = key === today;
                        return (
                            <div key={i} className={`min-h-10 rounded-md border p-1 transition-colors ${isToday ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600'}`}>
                                <p className={`text-right text-xs ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{d.getDate()}</p>
                                {dayTasks.slice(0, 2).map((t) => (
                                    <Link key={t.id} href={`${route('projects.show', t.project_id)}?task=${t.id}`} className="mt-0.5 block truncate rounded bg-indigo-100 px-1 text-[10px] text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" title={t.title}>
                                        {t.title}
                                    </Link>
                                ))}
                                {dayTasks.length > 2 && <p className="text-[10px] text-gray-400">+{dayTasks.length - 2} more</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const REPEAT_LABELS = { none: 'Once', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const REPEAT_OPTIONS = Object.entries(REPEAT_LABELS).map(([value, label]) => ({ value, label }));

function toDatetimeLocalValue(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatAlarmTime(dateStr) {
    const d = new Date(dateStr);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { time: `${h}:${String(m).padStart(2, '0')}`, ampm };
}

function timeLeftParts(remindAt, now) {
    const diffMs = new Date(remindAt) - now;
    const overdue = diffMs < 0;
    const abs = Math.abs(diffMs);
    const totalMinutes = Math.floor(abs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes, overdue };
}

function timeLeftLabel(remindAt, now, { short = false } = {}) {
    const { days, hours, minutes, overdue } = timeLeftParts(remindAt, now);

    if (!overdue && days === 0 && hours === 0 && minutes === 0) {
        return short ? '<1m' : 'less than 1 minute';
    }

    const segs = [];
    if (days > 0) segs.push(`${days}${short ? 'd' : ` day${days === 1 ? '' : 's'}`}`);
    if (hours > 0 || days > 0) segs.push(`${hours}${short ? 'h' : ` hour${hours === 1 ? '' : 's'}`}`);
    if (days === 0) segs.push(`${minutes}${short ? 'm' : ` minute${minutes === 1 ? '' : 's'}`}`);
    const text = segs.join(' ');
    return overdue ? `Overdue ${short ? text : `by ${text}`}` : `${short ? 'in ' : ''}${text}`;
}

const REMINDER_MENU_WIDTH = 144; // matches w-36

// Edit/Delete live behind this kebab; Dismiss stays out of the menu as its
// own standalone button on AlarmRow (only rendered for repeating reminders)
// since it's the one action people reach for often enough to want a single
// click, not two.
function ReminderKebabMenu({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    // Portal'd into document.body and positioned with fixed coordinates
    // instead of being absolutely positioned inside the row, so it isn't
    // clipped by the reminders list's own overflow-y-auto scroll container.
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const ref = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (
                ref.current && !ref.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Close on scroll/resize anywhere (capture phase also catches scrolling
    // inside the reminders list itself) rather than trying to keep the menu
    // glued to a moving anchor.
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    // Flip upward and clamp horizontally so the menu never runs past the
    // edge of the screen, same approach as TaskRow's KebabMenu.
    useLayoutEffect(() => {
        if (!open || !ref.current) return;
        const buttonRect = ref.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight ?? 0;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const openUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;
        const left = Math.min(
            Math.max(buttonRect.right - REMINDER_MENU_WIDTH, 8),
            window.innerWidth - REMINDER_MENU_WIDTH - 8
        );
        const top = openUpward ? buttonRect.top - menuHeight - 4 : buttonRect.bottom + 4;
        setPosition({ top, left });
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                title="More options"
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: position.top, left: position.left, width: REMINDER_MENU_WIDTH }}
                    className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}

function AlarmRow({ r, now, onDismiss, onDelete, isHighlighted }) {
    const { time, ampm } = formatAlarmTime(r.remind_at);
    const { overdue } = timeLeftParts(r.remind_at, now);
    const label = timeLeftLabel(r.remind_at, now, { short: true });
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // A deep-linked reminder (from a notification/email) should open its note
    // expanded, not just scroll into view collapsed. The scroll has to happen
    // *after* the expand has actually painted - otherwise it centers on the
    // shorter, collapsed card and the now-taller expanded one ends up with its
    // bottom (ring included) pushed outside the visible frame.
    useEffect(() => {
        if (!isHighlighted) return;
        if (r.note) setExpanded(true);

        let raf2;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                document.getElementById(`reminder-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, [isHighlighted, r.note, r.id]);

    const editForm = useForm({
        title: r.title,
        note: r.note ?? '',
        remind_at: toDatetimeLocalValue(r.remind_at),
        repeat_interval: r.repeat_interval,
    });

    const saveEdit = (e) => {
        e.preventDefault();
        editForm.transform((data) => ({ ...data, remind_at: localDateTimeToIso(data.remind_at) }));
        editForm.patch(route('reminders.update', r.id), {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    if (isEditing) {
        return (
            <li className="rounded-2xl bg-gray-50 px-4 py-3.5 dark:bg-gray-900/70">
                <form onSubmit={saveEdit} className="space-y-2">
                    <input
                        type="text"
                        placeholder="Reminder title..."
                        value={editForm.data.title}
                        onChange={(e) => editForm.setData('title', e.target.value)}
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        autoFocus
                    />
                    {editForm.errors.title && <p className="text-xs text-red-500">{editForm.errors.title}</p>}
                    <textarea
                        placeholder="Optional note..."
                        value={editForm.data.note}
                        onChange={(e) => editForm.setData('note', e.target.value)}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <div className="flex gap-2">
                        <input
                            type="datetime-local"
                            value={editForm.data.remind_at}
                            onChange={(e) => editForm.setData('remind_at', e.target.value)}
                            className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        />
                        <FilterSelect
                            className="w-36 shrink-0"
                            value={editForm.data.repeat_interval}
                            onChange={(v) => editForm.setData('repeat_interval', v)}
                            options={REPEAT_OPTIONS}
                        />
                    </div>
                    {editForm.errors.remind_at && <p className="text-xs text-red-500">{editForm.errors.remind_at}</p>}
                    <div className="flex gap-2">
                        <button type="submit" disabled={editForm.processing} className="flex flex-1 items-center justify-center rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                            {editForm.processing && <Spinner className="mr-1.5 h-3.5 w-3.5" />}
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 rounded-md bg-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li
            id={`reminder-${r.id}`}
            onClick={() => r.note && setExpanded((v) => !v)}
            className={`group overflow-hidden rounded-2xl bg-gray-50 px-4 py-3.5 transition dark:bg-gray-900/70 ${r.note ? 'cursor-pointer' : ''} ${
                isHighlighted ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 task-highlight-ring' : ''
            }`}
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl font-light tabular-nums leading-none ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-gray-50'}`}>
                            {time}
                        </span>
                        <span className={`text-sm font-semibold ${overdue ? 'text-red-400 dark:text-red-400/80' : 'text-gray-400 dark:text-gray-500'}`}>
                            {ampm}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                        {REPEAT_LABELS[r.repeat_interval]} &middot; {r.title}
                    </p>
                </div>

                <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
                    <span className={`text-[11px] font-medium tabular-nums ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {label}
                    </span>

                    {/* Dismiss only makes sense for a repeating reminder - skips the
                        upcoming occurrence without touching future ones. A one-off
                        reminder has no "next turn" to skip, so it only gets Edit/Delete
                        (in the kebab below). */}
                    {r.repeat_interval !== 'none' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                            title="Dismiss this occurrence (stays on your list, just skips the next alert)"
                            className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 dark:text-gray-500 dark:hover:bg-green-950/40 dark:hover:text-green-400"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}

                    <ReminderKebabMenu
                        onEdit={() => setIsEditing(true)}
                        onDelete={onDelete}
                    />
                </div>
            </div>

            {r.note && (
                <div className="mt-2 pl-0.5">
                    {expanded ? (
                        <NoteList note={r.note} className="text-xs text-gray-500 dark:text-gray-400" />
                    ) : (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {notePreview(r.note)}
                        </p>
                    )}
                    <p className="mt-0.5 text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                        {expanded ? 'Show less' : 'Show more'}
                    </p>
                </div>
            )}
        </li>
    );
}

const DUE_RANGE_EMPTY_LABELS = {
    today: 'Nothing due today',
    week: 'Nothing due in the next 7 days',
    month: 'Nothing due in the next 30 days',
    custom: 'Nothing due in this range',
};

function DueSoonPanel({ dueSoon, dueRange, dueCustomFrom, dueCustomTo, chartRange, chartCustomFrom, chartCustomTo }) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const sorted = useMemo(
        () => [...dueSoon].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        [dueSoon]
    );

    const dueDateRangeLabel = (() => {
        if (dueRange === 'custom' && dueCustomFrom && dueCustomTo) {
            return `${new Date(dueCustomFrom).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${new Date(dueCustomTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
        }
        if (dueRange === 'today') return new Date().toLocaleDateString(undefined, { dateStyle: 'full' });
        if (dueRange === 'month') return `${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(Date.now() + 29 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return `${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(Date.now() + 6 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    })();

    return (
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title="Due Soon"
                badge={sorted.length > 0 ? sorted.length : undefined}
                iconColor="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }
            >
                <DueSoonFilterMenu
                    range={dueRange}
                    routeName="dashboard"
                    customFrom={dueCustomFrom}
                    customTo={dueCustomTo}
                    extraParams={{ range: chartRange, from: chartCustomFrom, to: chartCustomTo }}
                />
            </SectionHeader>

            <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{dueDateRangeLabel}</p>

            {sorted.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{DUE_RANGE_EMPTY_LABELS[dueRange] ?? DUE_RANGE_EMPTY_LABELS.week}</p>
                </div>
            ) : (
                <ul className="thin-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1.5">
                    {sorted.map((task) => {
                        const { overdue } = timeLeftParts(task.due_date, now);
                        const relative = timeLeftLabel(task.due_date, now, { short: true });
                        return (
                            <li key={task.id}>
                                <Link
                                    href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                    className={`block rounded-md border-l-4 bg-gray-50 p-3 transition hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900/70 ${
                                        overdue ? 'border-l-red-500' : 'border-l-orange-400'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 truncate font-medium text-gray-800 dark:text-gray-200">{task.title}</p>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                            overdue
                                                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                                                : 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                                        }`}>
                                            {relative}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{task.project?.name}</p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(task.due_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function RemindersPanel({ reminders, highlightedReminderId }) {
    const { data, setData, post, processing, reset, errors, transform } = useForm({
        title: '', note: '', remind_at: '', repeat_interval: 'none',
    });
    const [showForm, setShowForm] = useState(false);
    const [now, setNow] = useState(() => new Date());
    const { confirm, ConfirmDialog } = useConfirm();

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        transform((data) => ({ ...data, remind_at: localDateTimeToIso(data.remind_at) }));
        post(route('reminders.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    const remove = async (id) => { if (await confirm('Delete this reminder?', { title: 'Delete Reminder?', danger: true, confirmLabel: 'Delete' })) router.delete(route('reminders.destroy', id), { preserveScroll: true }); };

    const dismiss = (id) => router.patch(route('reminders.dismiss', id), {}, { preserveScroll: true });

    const sorted = useMemo(
        () => [...reminders].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)),
        [reminders]
    );
    const nextUp = sorted.find((r) => new Date(r.remind_at) >= now);

    return (
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title="Reminders"
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            >
                <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500">
                    {showForm ? 'Cancel' : (
                        <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            New Reminder
                        </>
                    )}
                </button>
            </SectionHeader>

            {nextUp && !showForm && (
                <p className="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    Next reminder {timeLeftLabel(nextUp.remind_at, now)}
                </p>
            )}

            {showForm && (
                <form onSubmit={submit} className="mb-4 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    <input type="text" placeholder="Reminder title..." value={data.title} onChange={(e) => setData('title', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" autoFocus />
                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    <textarea placeholder="Optional note..." value={data.note} onChange={(e) => setData('note', e.target.value)} rows={2} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <div className="flex gap-2">
                        <input type="datetime-local" value={data.remind_at} onChange={(e) => setData('remind_at', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                        <FilterSelect className="w-36 shrink-0" value={data.repeat_interval} onChange={(v) => setData('repeat_interval', v)} options={REPEAT_OPTIONS} />
                    </div>
                    {errors.remind_at && <p className="text-xs text-red-500">{errors.remind_at}</p>}
                    <button type="submit" disabled={processing} className="flex w-full items-center justify-center rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        {processing && <Spinner className="mr-1.5 h-3.5 w-3.5" />}
                        Set Reminder
                    </button>
                </form>
            )}

            {sorted.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No reminders set</p>
                </div>
            ) : (
                /* px/py (not just pr) so the highlight ring on a deep-linked
                   reminder has room to render fully - overflow-y-auto forces
                   overflow-x to clip too (CSS spec: setting only one axis to
                   non-visible flips the other from visible to auto), so
                   without left/top/bottom padding the ring's box-shadow was
                   getting cut off flush against the scroll container's edge. */
                <ul className="thin-scrollbar max-h-80 space-y-2 overflow-y-auto px-1.5 py-1">
                    {sorted.map((r) => (
                        <AlarmRow key={r.id} r={r} now={now} onDismiss={() => dismiss(r.id)} onDelete={() => remove(r.id)} isHighlighted={r.id === highlightedReminderId} />
                    ))}
                </ul>
            )}
            {ConfirmDialog}
        </div>
    );
}

function NoteItemMini({ item, onToggle }) {
    return (
        <li className="note-item-row group/item flex items-start gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm dark:bg-gray-800/60">
            <button
                type="button"
                onClick={onToggle}
                aria-pressed={item.done}
                aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    item.done
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 bg-white hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900'
                }`}
            >
                {item.done && (
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            <span className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm ${item.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                {item.text}
            </span>
        </li>
    );
}

// Lighter-weight sibling of Projects/Show.jsx's NoteCard - a glance-and-tick
// view for the dashboard rollup. Toggling still hits the real
// projects.notes.items.toggle route (so it stays in sync everywhere,
// including the source task checklist for linked items), but there's no
// edit/delete/add-item chrome here - that lives on the project's own My
// Notes panel, this is just "check things off without leaving the dashboard".
function MiniNoteCard({ note, onToggleItem }) {
    const items = note.content ?? [];
    const doneCount = items.filter((i) => i.done).length;
    const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;
    // Collapsed by default, same as Projects/Show.jsx's NoteCard - the
    // project group is already minimized on load, so a checklist inside it
    // shouldn't dump its full item list the moment that group opens.
    const [expanded, setExpanded] = useState(false);

    return (
        <li className="rounded border border-gray-200 bg-white px-3.5 py-3 dark:border-gray-700 dark:bg-gray-800">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-start justify-between gap-2 text-left"
                title={expanded ? 'Minimize checklist' : 'Maximize checklist'}
            >
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{note.title || 'Checklist'}</p>
                    <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                            <div className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400 dark:text-gray-500">{doneCount}/{items.length}</span>
                    </div>
                </div>
                <svg className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {expanded && items.length > 0 && (
                // Same soft border-t treatment as Projects/Show.jsx's NoteCard,
                // so the rollup here reads consistently with the full panel.
                <div className="mt-2 border-t border-gray-200/70 pt-1.5 dark:border-gray-700/50">
                    <ul className="space-y-1.5">
                        {items.map((item) => (
                            <NoteItemMini key={item.id} item={item} onToggle={() => onToggleItem(item.id)} />
                        ))}
                    </ul>
                </div>
            )}
        </li>
    );
}

// Personal-dashboard rollup of every private checklist this user has, across
// every project - grouped so each project only shows up here if it actually
// has notes (see DashboardController::index's groupBy), rather than listing
// every project the person belongs to whether or not they've jotted anything
// down. Each project group is independently collapsible, same interaction
// pattern as NotesPanel's own collapse toggle.
function MyNotesPanel({ notesByProject }) {
    // Every project group starts minimized - the dashboard is a quick glance,
    // not the place to read through full checklists; people expand only the
    // project they care about right now.
    const [collapsedProjectIds, setCollapsedProjectIds] = useState(
        () => new Set(notesByProject.map((group) => group.project.id))
    );

    const toggleProjectCollapse = (projectId) => {
        setCollapsedProjectIds((prev) => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    const toggleItem = (noteId, itemId) => router.patch(route('projects.notes.items.toggle', [noteId, itemId]), {}, { preserveScroll: true });

    const totalNotes = notesByProject.reduce((sum, group) => sum + group.notes.length, 0);

    return (
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
            <SectionHeader
                title={
                    <span className="inline-flex items-center gap-2">
                        My Notes
                        {totalNotes > 0 && (
                            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                {totalNotes}
                            </span>
                        )}
                    </span>
                }
                icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M2 12v6a2 2 0 002 2h12" />
                    </svg>
                }
            />

            {notesByProject.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M2 12v6a2 2 0 002 2h12" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No checklists yet</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">Open a project to jot down a private checklist</p>
                </div>
            ) : (
                <div className="thin-scrollbar max-h-80 space-y-3 overflow-y-auto pr-1.5">
                    {notesByProject.map((group) => {
                        const isCollapsed = collapsedProjectIds.has(group.project.id);
                        return (
                            <div key={group.project.id}>
                                <button
                                    onClick={() => toggleProjectCollapse(group.project.id)}
                                    className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-left hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700/60 dark:hover:bg-gray-700"
                                >
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <Link
                                            href={route('projects.show', group.project.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="truncate text-sm font-semibold text-gray-800 hover:underline dark:text-gray-200"
                                        >
                                            {group.project.name}
                                        </Link>
                                    </span>
                                    <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400 dark:text-gray-500">
                                        {group.notes.length} checklist{group.notes.length === 1 ? '' : 's'}
                                    </span>
                                </button>
                                {!isCollapsed && (
                                    <ul className="mt-1 space-y-1.5 pl-1">
                                        {group.notes.map((note) => (
                                            <MiniNoteCard key={note.id} note={note} onToggleItem={(itemId) => toggleItem(note.id, itemId)} />
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ stats, range, customFrom, customTo, dueRange, dueCustomFrom, dueCustomTo, myNotes = [] }) {
    const navigateSessionActivity = (offset) => {
        router.get(route('dashboard', { range, from: customFrom, to: customTo, due_range: dueRange, due_from: dueCustomFrom, due_to: dueCustomTo, session_offset: offset }), {}, {
            only: ['stats'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalTasks = Object.values(stats.tasksByStatus).reduce((a, b) => a + b, 0);
    const activeRatio = totalTasks ? Math.round((stats.activeTasksCount / totalTasks) * 100) : 0;
    const [highlightedReminderId, setHighlightedReminderId] = useState(null);
    const [chartType, setChartType] = useState('area');
    const activitySeries = [
        { key: 'completed', name: 'Tasks Done', color: '#4f46e5' },
        { key: 'created', name: 'Tasks Created', color: '#f59e0b' },
        { key: 'submitted', name: 'Tasks Submitted', color: '#10b981', dash: '4 2' },
        { key: 'projects', name: 'Projects Joined', color: '#ec4899', dash: '2 2' },
        { key: 'completedProjects', name: 'Completed Projects', color: '#a855f7', dash: '5 3' },
    ];

    useEffect(() => {
        const reminderId = new URLSearchParams(window.location.search).get('reminder');
        if (!reminderId) return;
        setHighlightedReminderId(Number(reminderId));
        const clearTimer = setTimeout(() => setHighlightedReminderId(null), 3000);
        return () => clearTimeout(clearTimer);
    }, []);

    const dateRangeLabel = (() => {
        if (range === 'custom' && customFrom && customTo) {
            return `${new Date(customFrom).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${new Date(customTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
        }
        if (range === 'today') return new Date().toLocaleDateString(undefined, { dateStyle: 'full' });
        if (range === 'month') return `${new Date(Date.now() - 29 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return `${new Date(Date.now() - 6 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    })();

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Dashboard</h2>
                <Link
                    href={route('activity.index')}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Activity Logs
                </Link>
            </div>
        }>
            <Head title="Dashboard" />
            <div className="py-8">
                <div className="mx-auto max-w-8xl space-y-6 px-3 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <StatCard label="Active Tasks" value={stats.activeTasksCount} sub={`${activeRatio}% of tasks · ${stats.activeDueSoonCount} due in 7d`} icon={statIcons.active} accentColor="text-indigo-600 dark:text-indigo-400" />
                        <StatCard label="Tasks Completed" value={stats.doneTasksCount} sub="Assigned to you" pct={stats.doneTasksTrend} icon={statIcons.done} accentColor="text-green-600 dark:text-green-400" />
                        <StatCard label="Projects" value={stats.projectsCount} sub="You're a member of" pct={stats.projectsTrend} icon={statIcons.projects} />
                        <StatCard label="Awaiting Your Review" value={stats.pendingReview} sub="Submitted tasks to check" pct={stats.pendingReviewTrend} icon={statIcons.review} accentColor="text-purple-600 dark:text-purple-400" />
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
                        <SectionHeader
                            title="Activity"
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                        >
                            <ChartControlsMenu
                                chartType={chartType}
                                onChartTypeChange={setChartType}
                                range={range}
                                routeName="dashboard"
                                customFrom={customFrom}
                                customTo={customTo}
                                extraParams={{ due_range: dueRange, due_from: dueCustomFrom, due_to: dueCustomTo }}
                            />
                        </SectionHeader>

                        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{dateRangeLabel}</p>

                        <ActivityChart
                            chartType={chartType}
                            data={stats.chartData}
                            series={activitySeries}
                            height={240}
                            emptySubtitle="Nothing was created or completed in this range. Try widening it, or check back once activity picks up."
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:ring-white/[0.05] dark:hover:ring-white/[0.16] dark:hover:shadow-lg dark:hover:shadow-black/50 dark:bg-gray-800 sm:p-6">
                            <SectionHeader
                                title="My Tasks by Status"
                                icon={
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                    </svg>
                                }
                            />
                            <div className="flex flex-col items-center gap-6 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-center">
                                <StatusDonut tasksByStatus={stats.tasksByStatus} total={totalTasks} size={140} strokeWidth={16} />
                                <div className="w-full max-w-xs space-y-1">
                                    {Object.entries(statusLabels).map(([key, label]) => {
                                        const count = stats.tasksByStatus[key] ?? 0;
                                        const pct = totalTasks ? Math.round((count / totalTasks) * 100) : 0;
                                        return (
                                            <div key={key} className="rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColors[key]}`} />
                                                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                                    <span className="w-9 text-right text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                                                </div>
                                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-600">
                                                    <div className={`h-full rounded-full ${statusColors[key]} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <CalendarView tasks={stats.calendarTasks} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <SessionActivityCalendar
                            sessionsByDay={stats.sessionActivity}
                            offset={stats.sessionOffset}
                            onNavigate={navigateSessionActivity}
                            userBreakdownByDay={stats.sessionDeviceBreakdown}
                            durationByDay={stats.sessionDuration}
                        />

                        <DueSoonPanel
                            dueSoon={stats.dueSoon}
                            dueRange={dueRange}
                            dueCustomFrom={dueCustomFrom}
                            dueCustomTo={dueCustomTo}
                            chartRange={range}
                            chartCustomFrom={customFrom}
                            chartCustomTo={customTo}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <MyNotesPanel notesByProject={myNotes} />

                        <RemindersPanel reminders={stats.reminders} highlightedReminderId={highlightedReminderId} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
