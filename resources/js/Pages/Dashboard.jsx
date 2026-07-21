import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { localDateTimeToIso } from '@/utils/datetime';
import { NoteList, notePreview } from '@/utils/noteFormat';

const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    in_review: 'In Review',
    done: 'Done',
};

const statusColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    submitted: 'bg-yellow-500',
    in_review: 'bg-purple-500',
    done: 'bg-green-500',
};

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

function StatusDonut({ tasksByStatus, total, size = 160, strokeWidth = 18 }) {
    const strokeColors = {
        todo: '#9ca3af',
        in_progress: '#3b82f6',
        submitted: '#eab308',
        in_review: '#a855f7',
        done: '#22c55e',
    };
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;
    const segments = Object.keys(statusLabels).map((key) => {
        const count = tasksByStatus[key] ?? 0;
        const dash = total ? (count / total) * circumference : 0;
        const seg = { key, dash, offset: cumulative, count };
        cumulative += dash;
        return seg;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-gray-700" />
                {segments.filter((s) => s.count > 0).map((s) => (
                    <circle
                        key={s.key}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={strokeColors[s.key]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                        strokeDashoffset={-s.offset}
                    />
                ))}
            </g>
            <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" style={{ fontSize: 30, fontWeight: 700 }}>
                {total}
            </text>
            <text x="50%" y="62%" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: 11 }}>
                Tasks
            </text>
        </svg>
    );
}

function StatCard({ label, value, sub, icon, accentColor }) {
    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`mt-1 text-3xl font-semibold ${accentColor ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
                    {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
                </div>
                {icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 ${accentColor ?? 'text-gray-400 dark:text-gray-400'}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

function RangeButtons({ range, routeName, customFrom, customTo }) {
    const [showCustom, setShowCustom] = useState(range === 'custom');
    const [from, setFrom] = useState(customFrom ?? '');
    const [to, setTo] = useState(customTo ?? '');

    const applyCustom = () => {
        if (from && to) router.get(route(routeName, { range: 'custom', from, to }), {}, { preserveScroll: true });
    };

    return (
        <div className="flex flex-wrap items-center gap-1">
            {Object.entries({ today: 'Today', week: 'This Week', month: 'This Month' }).map(([key, label]) => (
                <Link
                    key={key}
                    href={route(routeName, { range: key })}
                    preserveScroll
                    className={`rounded-md px-3 py-1 text-xs ${range === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                    onClick={() => setShowCustom(false)}
                >
                    {label}
                </Link>
            ))}
            <button onClick={() => setShowCustom((v) => !v)} className={`rounded-md px-3 py-1 text-xs ${range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                Custom
            </button>
            {showCustom && (
                <div className="flex items-center gap-1">
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <span className="text-xs text-gray-400">to</span>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <button onClick={applyCustom} className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-500">Go</button>
                </div>
            )}
        </div>
    );
}

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

    const rangeLabel = calRange === 'week'
        ? `Week of ${days[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : calRange === 'month'
        ? baseDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : baseDate.getFullYear().toString();

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Deadline Calendar</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">←</button>
                    <span className="min-w-32 text-center text-sm text-gray-600 dark:text-gray-400">{rangeLabel}</span>
                    <button onClick={() => navigate(1)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">→</button>
                    <div className="ml-2 flex gap-1">
                        {['week', 'month', 'year'].map((r) => (
                            <button key={r} onClick={() => setCalRange(r)} className={`rounded-md px-2 py-1 text-xs capitalize ${calRange === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {calRange === 'year' ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {days.map((d, i) => {
                        const monthTasks = tasksByDay[i] ?? [];
                        return (
                            <div key={i} className="rounded-md border border-gray-100 p-2 dark:border-gray-700">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{d.toLocaleDateString(undefined, { month: 'short' })}</p>
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
                            <div key={i} className={`min-h-10 rounded-md border p-1 ${isToday ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 dark:border-gray-700'}`}>
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

function AlarmRow({ r, now, onDelete }) {
    const { time, ampm } = formatAlarmTime(r.remind_at);
    const { overdue } = timeLeftParts(r.remind_at, now);
    const label = timeLeftLabel(r.remind_at, now, { short: true });
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
                        <select
                            value={editForm.data.repeat_interval}
                            onChange={(e) => editForm.setData('repeat_interval', e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                            {Object.entries(REPEAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    {editForm.errors.remind_at && <p className="text-xs text-red-500">{editForm.errors.remind_at}</p>}
                    <div className="flex gap-2">
                        <button type="submit" disabled={editForm.processing} className="flex-1 rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
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
            onClick={() => r.note && setExpanded((v) => !v)}
            className={`group overflow-hidden rounded-2xl bg-gray-50 px-4 py-3.5 transition dark:bg-gray-900/70 ${r.note ? 'cursor-pointer' : ''}`}
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

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        title="Edit reminder"
                        className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        role="switch"
                        aria-checked="true"
                        title="Delete reminder"
                        className="relative h-6 w-10 shrink-0 rounded-full bg-indigo-600 transition-colors hover:bg-red-500"
                    >
                        <span className="absolute left-0.5 top-0.5 h-5 w-5 translate-x-4 rounded-full bg-white shadow transition-transform" />
                    </button>
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

function DueSoonPanel({ dueSoon }) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const sorted = useMemo(
        () => [...dueSoon].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        [dueSoon]
    );

    return (
        <div className="min-w-0 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Due Soon</h3>
                {sorted.length > 0 && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {sorted.length}
                    </span>
                )}
            </div>

            {sorted.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Nothing due in the next 7 days</p>
                </div>
            ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
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

function RemindersPanel({ reminders }) {
    const { data, setData, post, processing, reset, errors, transform } = useForm({
        title: '', note: '', remind_at: '', repeat_interval: 'none',
    });
    const [showForm, setShowForm] = useState(false);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        transform((data) => ({ ...data, remind_at: localDateTimeToIso(data.remind_at) }));
        post(route('reminders.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    const remove = (id) => { if (confirm('Delete this reminder?')) router.delete(route('reminders.destroy', id), { preserveScroll: true }); };

    const sorted = useMemo(
        () => [...reminders].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)),
        [reminders]
    );
    const nextUp = sorted.find((r) => new Date(r.remind_at) >= now);

    return (
        <div className="min-w-0 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reminders</h3>
                </div>
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
            </div>

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
                        <select value={data.repeat_interval} onChange={(e) => setData('repeat_interval', e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            {Object.entries(REPEAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    {errors.remind_at && <p className="text-xs text-red-500">{errors.remind_at}</p>}
                    <button type="submit" disabled={processing} className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Set Reminder</button>
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
                <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {sorted.map((r) => (
                        <AlarmRow key={r.id} r={r} now={now} onDelete={() => remove(r.id)} />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Dashboard({ stats, range, customFrom, customTo }) {
    const totalTasks = Object.values(stats.tasksByStatus).reduce((a, b) => a + b, 0);
    const totals = stats.activityTotals ?? { completed: 0, created: 0, projects: 0 };

    const dateRangeLabel = (() => {
        if (range === 'custom' && customFrom && customTo) {
            return `${new Date(customFrom).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${new Date(customTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
        }
        if (range === 'today') return new Date().toLocaleDateString(undefined, { dateStyle: 'full' });
        if (range === 'month') return `${new Date(Date.now() - 29 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return `${new Date(Date.now() - 6 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    })();

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Dashboard</h2>}>
            <Head title="Dashboard" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Active Tasks" value={stats.activeTasksCount} sub="Assigned to you, not yet done" icon={statIcons.active} accentColor="text-indigo-600 dark:text-indigo-400" />
                        <StatCard label="Tasks Completed" value={stats.doneTasksCount} sub="Marked done, assigned to you" icon={statIcons.done} accentColor="text-green-600 dark:text-green-400" />
                        <StatCard label="Projects" value={stats.projectsCount} sub="You're a member of" icon={statIcons.projects} />
                        <StatCard label="Awaiting Your Review" value={stats.pendingReview} sub="Submitted tasks to check" icon={statIcons.review} accentColor="text-purple-600 dark:text-purple-400" />
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">My Tasks by Status</h3>
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                            <StatusDonut tasksByStatus={stats.tasksByStatus} total={totalTasks} />
                            <div className="w-full max-w-xs space-y-2">
                                {Object.entries(statusLabels).map(([key, label]) => {
                                    const count = stats.tasksByStatus[key] ?? 0;
                                    const pct = totalTasks ? Math.round((count / totalTasks) * 100) : 0;
                                    return (
                                        <div key={key} className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColors[key]}`} />
                                            <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                            <span className="w-9 text-right text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <DueSoonPanel dueSoon={stats.dueSoon} />

                        <RemindersPanel reminders={stats.reminders} />
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
                            <RangeButtons range={range} routeName="dashboard" customFrom={customFrom} customTo={customTo} />
                        </div>

                        <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{dateRangeLabel}</p>

                        <div className="mb-4 grid grid-cols-3 gap-3">
                            <div className="rounded-md bg-teal-50 p-3 text-center dark:bg-teal-950/30">
                                <p className="text-xl font-semibold text-teal-700 dark:text-teal-400">{totals.completed}</p>
                                <p className="text-xs text-teal-600 dark:text-teal-500">Completed</p>
                            </div>
                            <div className="rounded-md bg-amber-50 p-3 text-center dark:bg-amber-950/30">
                                <p className="text-xl font-semibold text-amber-700 dark:text-amber-400">{totals.created}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-500">Assigned</p>
                            </div>
                            <div className="rounded-md bg-indigo-50 p-3 text-center dark:bg-indigo-950/30">
                                <p className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">{totals.projects}</p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-500">Projects Joined</p>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.25} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} allowDecimals={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{ color: 'currentColor' }} />
                                <Area type="monotone" dataKey="completed" name="Tasks Done" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />
                                <Line type="monotone" dataKey="created" name="Tasks Created" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                                <Line type="monotone" dataKey="newProjects" name="New Projects" stroke="#ec4899" strokeWidth={2} dot={false} strokeDasharray="2 2" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <CalendarView tasks={stats.calendarTasks} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
