import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';
import { localDateTimeToIso } from '@/utils/datetime';

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

function RepeatIcon({ className = 'h-3 w-3' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}

function ReminderCard({ r, overdue, onDismiss, onRemove }) {
    return (
        <li className={`rounded-lg border p-3 transition ${
            overdue
                ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20'
                : 'border-gray-100 hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600'
        }`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    overdue ? 'bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400'
                }`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{r.title}</p>
                    {r.note && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
                    <div className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${overdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span>{new Date(r.remind_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {r.repeat_interval !== 'none' && (
                            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                <RepeatIcon className="h-2.5 w-2.5" /> {REPEAT_LABELS[r.repeat_interval]}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                    {overdue && (
                        <button onClick={onDismiss} title="Dismiss" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                    <button onClick={onRemove} title="Delete" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </li>
    );
}

function RemindersPanel({ reminders }) {
    const { data, setData, post, processing, reset, errors, transform } = useForm({
        title: '', note: '', remind_at: '', repeat_interval: 'none',
    });
    const [showForm, setShowForm] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        transform((data) => ({ ...data, remind_at: localDateTimeToIso(data.remind_at) }));
        post(route('reminders.store'), { onSuccess: () => { reset(); setShowForm(false); } });
    };

    const dismiss = (id) => router.patch(route('reminders.dismiss', id), {}, { preserveScroll: true });
    const remove = (id) => { if (confirm('Delete this reminder?')) router.delete(route('reminders.destroy', id), { preserveScroll: true }); };

    const now = new Date();
    const overdue = reminders.filter((r) => new Date(r.remind_at) < now);
    const upcoming = reminders.filter((r) => new Date(r.remind_at) >= now);

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
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

            {overdue.length === 0 && upcoming.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No reminders set</p>
                </div>
            ) : (
                <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                    {overdue.length > 0 && (
                        <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">Overdue</p>
                            <ul className="space-y-2">
                                {overdue.map((r) => (
                                    <ReminderCard key={r.id} r={r} overdue onDismiss={() => dismiss(r.id)} onRemove={() => remove(r.id)} />
                                ))}
                            </ul>
                        </div>
                    )}
                    {upcoming.length > 0 && (
                        <div>
                            {overdue.length > 0 && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Upcoming</p>}
                            <ul className="space-y-2">
                                {upcoming.map((r) => (
                                    <ReminderCard key={r.id} r={r} overdue={false} onRemove={() => remove(r.id)} />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
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
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Due Soon</h3>
                            {stats.dueSoon.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Nothing due in the next 7 days.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {stats.dueSoon.map((task) => (
                                        <li key={task.id}>
                                            <Link href={`${route('projects.show', task.project_id)}?task=${task.id}`} className="block rounded-md border border-gray-100 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                                                <p className="truncate font-medium text-gray-800 dark:text-gray-200">{task.title}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{task.project?.name}</p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    {new Date(task.due_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

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
