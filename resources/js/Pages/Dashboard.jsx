import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

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

const rangeLabels = { today: 'Today', week: 'This Week', month: 'This Month' };

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

function RangeButtons({ range }) {
    return (
        <div className="flex gap-1">
            {Object.entries(rangeLabels).map(([key, label]) => (
                <Link
                    key={key}
                    href={route('dashboard', { range: key })}
                    preserveScroll
                    className={`rounded-md px-3 py-1 text-xs ${
                        range === key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    {label}
                </Link>
            ))}
        </div>
    );
}

function CalendarView({ tasks }) {
    const [calRange, setCalRange] = useState('week');
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
            return Array.from({ length: 12 }, (_, i) => {
                const d = new Date(start.getFullYear(), i, 1);
                return d;
            });
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
            const key = calRange === 'year'
                ? new Date(task.due_date).getMonth()
                : new Date(task.due_date).toDateString();
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
                            <button
                                key={r}
                                onClick={() => setCalRange(r)}
                                className={`rounded-md px-2 py-1 text-xs capitalize ${calRange === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                            >
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
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {d.toLocaleDateString(undefined, { month: 'short' })}
                                </p>
                                {monthTasks.length > 0 && (
                                    <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">{monthTasks.length} deadline{monthTasks.length > 1 ? 's' : ''}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={`grid gap-2 ${calRange === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                    {calRange === 'week' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <p key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</p>
                    ))}
                    {calRange === 'month' && ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <p key={i} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500">{d}</p>
                    ))}
                    {calRange === 'month' && days[0] && Array.from({ length: days[0].getDay() }, (_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {days.map((d, i) => {
                        const key = d.toDateString();
                        const dayTasks = tasksByDay[key] ?? [];
                        const isToday = key === today;
                        return (
                            <div key={i} className={`min-h-10 rounded-md border p-1 ${isToday ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-100 dark:border-gray-700'}`}>
                                <p className={`text-right text-xs ${isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {d.getDate()}
                                </p>
                                {dayTasks.slice(0, 2).map((t) => (
                                    <Link
                                        key={t.id}
                                        href={`${route('projects.show', t.project_id)}?task=${t.id}`}
                                        className="mt-0.5 block truncate rounded bg-indigo-100 px-1 text-[10px] text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                                        title={t.title}
                                    >
                                        {t.title}
                                    </Link>
                                ))}
                                {dayTasks.length > 2 && (
                                    <p className="text-[10px] text-gray-400">+{dayTasks.length - 2} more</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function RemindersPanel({ reminders }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        note: '',
        remind_at: '',
    });
    const [showForm, setShowForm] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('reminders.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const dismiss = (id) => router.patch(route('reminders.dismiss', id), {}, { preserveScroll: true });
    const remove = (id) => {
        if (confirm('Delete this reminder?')) router.delete(route('reminders.destroy', id), { preserveScroll: true });
    };

    const now = new Date();
    const overdue = reminders.filter((r) => new Date(r.remind_at) < now);
    const upcoming = reminders.filter((r) => new Date(r.remind_at) >= now);

    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reminders</h3>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
                >
                    {showForm ? 'Cancel' : '+ New'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={submit} className="mb-4 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder="Reminder title..."
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    <textarea
                        placeholder="Optional note..."
                        value={data.note}
                        onChange={(e) => setData('note', e.target.value)}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <input
                        type="datetime-local"
                        value={data.remind_at}
                        onChange={(e) => setData('remind_at', e.target.value)}
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    {errors.remind_at && <p className="text-xs text-red-500">{errors.remind_at}</p>}
                    <button type="submit" disabled={processing} className="w-full rounded-md bg-indigo-600 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50">
                        Set Reminder
                    </button>
                </form>
            )}

            {overdue.length > 0 && (
                <div className="mb-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-500">Overdue</p>
                    <ul className="space-y-2">
                        {overdue.map((r) => (
                            <li key={r.id} className="flex items-start justify-between gap-2 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/30">
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.title}</p>
                                    {r.note && <p className="text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
                                    <p className="text-xs text-red-500">{new Date(r.remind_at).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => dismiss(r.id)} className="text-xs text-gray-500 hover:underline dark:text-gray-400">Dismiss</button>
                                    <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {upcoming.length > 0 ? (
                <ul className="space-y-2">
                    {upcoming.map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-2 rounded-md border border-gray-100 p-2 dark:border-gray-700">
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.title}</p>
                                {r.note && <p className="text-xs text-gray-500 dark:text-gray-400">{r.note}</p>}
                                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(r.remind_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </li>
                    ))}
                </ul>
            ) : (
                !overdue.length && <p className="text-sm text-gray-400 dark:text-gray-500">No reminders set.</p>
            )}
        </div>
    );
}

export default function Dashboard({ stats, range }) {
    const totalTasks = Object.values(stats.tasksByStatus).reduce((a, b) => a + b, 0);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Dashboard</h2>}>
            <Head title="Dashboard" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    {/* Top-level stats */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Active Tasks"
                            value={stats.activeTasksCount}
                            sub="Assigned to you, not yet done"
                            icon={statIcons.active}
                            accentColor="text-indigo-600 dark:text-indigo-400"
                        />
                        <StatCard
                            label="Tasks Completed"
                            value={stats.doneTasksCount}
                            sub="Marked done, assigned to you"
                            icon={statIcons.done}
                            accentColor="text-green-600 dark:text-green-400"
                        />
                        <StatCard
                            label="Projects"
                            value={stats.projectsCount}
                            sub="You're a member of"
                            icon={statIcons.projects}
                        />
                        <StatCard
                            label="Awaiting Your Review"
                            value={stats.pendingReview}
                            sub="Submitted tasks to check"
                            icon={statIcons.review}
                            accentColor="text-purple-600 dark:text-purple-400"
                        />
                    </div>

                    {/* Actionable: what needs attention right now */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Due Soon</h3>
                            {stats.dueSoon.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Nothing due in the next 7 days.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {stats.dueSoon.map((task) => (
                                        <li key={task.id}>
                                            <Link
                                                href={`${route('projects.show', task.project_id)}?task=${task.id}`}
                                                className="block rounded-md border border-gray-100 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                                            >
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

                    {/* Activity trend */}
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
                            <RangeButtons range={range} />
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.25} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="completed" name="Tasks Completed" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />
                                <Line type="monotone" dataKey="created" name="Tasks Assigned" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="projects" name="Projects Joined" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Reference: breakdown + calendar */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 lg:col-span-1">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">My Tasks by Status</h3>
                            <div className="space-y-3">
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColors[key]}`} />
                                        <span className="w-20 text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                        <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className={`h-2 rounded-full ${statusColors[key]}`}
                                                style={{ width: `${totalTasks ? ((stats.tasksByStatus[key] ?? 0) / totalTasks) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right text-sm text-gray-500 dark:text-gray-400">{stats.tasksByStatus[key] ?? 0}</span>
                                    </div>
                                ))}
                                {totalTasks === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No tasks assigned to you yet.</p>}
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <CalendarView tasks={stats.calendarTasks} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}