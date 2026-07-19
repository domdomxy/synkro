import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import StatCard from '@/Components/StatCard';
import { Head, Link, router } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { useEcho } from '@laravel/echo-react';

const statusLabels = { todo: 'To Do', in_progress: 'In Progress', submitted: 'Submitted', in_review: 'In Review', done: 'Done' };
const statusColors = { todo: 'bg-gray-400', in_progress: 'bg-blue-500', submitted: 'bg-yellow-500', in_review: 'bg-purple-500', done: 'bg-green-500' };

const statIcons = {
    users: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-4-4" /></svg>,
    admins: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    projects: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    tasks: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    warning: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    appeal: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    feedback: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    newThisMonth: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
    growth: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    online: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M12 12h.008v.008H12V12z" /></svg>,
    completed: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function SectionHeading({ children }) {
    return <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{children}</h3>;
}

function StatusDonut({ tasksByStatus, total, size = 140, strokeWidth = 15 }) {
    const strokeColors = { todo: '#9ca3af', in_progress: '#3b82f6', submitted: '#eab308', in_review: '#a855f7', done: '#22c55e' };
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
                    <circle key={s.key} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={strokeColors[s.key]} strokeWidth={strokeWidth} strokeDasharray={`${s.dash} ${circumference - s.dash}`} strokeDashoffset={-s.offset} strokeLinecap="round" />
                ))}
            </g>
            <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" style={{ fontSize: 26, fontWeight: 700 }}>{total}</text>
            <text x="50%" y="62%" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: 10 }}>Tasks</text>
        </svg>
    );
}

function RangeButtons({ range, routeName, customFrom, customTo }) {
    const [showCustom, setShowCustom] = useState(range === 'custom');
    const [from, setFrom] = useState(customFrom ?? '');
    const [to, setTo] = useState(customTo ?? '');
    const applyCustom = () => { if (from && to) router.get(route(routeName, { range: 'custom', from, to }), {}, { preserveScroll: true }); };
    return (
        <div className="flex flex-wrap items-center gap-1">
            {Object.entries({ today: 'Today', week: 'This Week', month: 'This Month' }).map(([key, label]) => (
                <Link key={key} href={route(routeName, { range: key })} preserveScroll
                    className={`rounded-md px-3 py-1 text-xs ${range === key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}
                    onClick={() => setShowCustom(false)}>
                    {label}
                </Link>
            ))}
            <button onClick={() => setShowCustom((v) => !v)} className={`rounded-md px-3 py-1 text-xs ${range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>Custom</button>
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

function AttentionPanel({ items }) {
    const visible = items.filter((i) => i.count > 0);
    if (visible.length === 0) return null;
    return (
        <div className="rounded-lg border border-amber-200 bg-white shadow dark:border-amber-900/40 dark:bg-gray-800">
            <div className="flex items-center gap-2 border-b border-amber-100 px-5 py-3 dark:border-amber-900/30">
                <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs Attention</h3>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {visible.map((item) => (
                    <li key={item.label}>
                        <Link href={item.href ?? '#'} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
                            <div className="flex items-center gap-2.5">
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.color}`}>{item.icon}</span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">{item.count}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TasksByStatusCard({ tasksByStatus, total }) {
    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <SectionHeading>Tasks by Status</SectionHeading>
            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
                <StatusDonut tasksByStatus={tasksByStatus} total={total} />
                <ul className="w-full max-w-xs divide-y divide-gray-100 dark:divide-gray-700">
                    {Object.entries(statusLabels).map(([key, label]) => {
                        const count = tasksByStatus[key] ?? 0;
                        const pct = total ? Math.round((count / total) * 100) : 0;
                        return (
                            <li key={key} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColors[key]}`} />
                                <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                <span className="w-9 text-right text-xs text-gray-400 dark:text-gray-500">{pct}%</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function RecentPanel({ title, viewAllHref, viewAllLabel, children }) {
    return (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {children}
            <Link href={viewAllHref} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                {viewAllLabel} <span aria-hidden>→</span>
            </Link>
        </div>
    );
}

export default function Dashboard({ stats, range, customFrom, customTo }) {
    const totalTasks = stats.tasks;

    const [liveCounts, setLiveCounts] = useState({
        pendingAppeals: stats.pendingAppeals,
        pendingFeedbacks: stats.pendingFeedbacks,
    });

    useEffect(() => {
        setLiveCounts({ pendingAppeals: stats.pendingAppeals, pendingFeedbacks: stats.pendingFeedbacks });
    }, [stats.pendingAppeals, stats.pendingFeedbacks]);

    useEcho('admin-alerts', ['.alerts.updated'], (payload) => {
        setLiveCounts({ pendingAppeals: payload.pendingAppeals, pendingFeedbacks: payload.pendingFeedbacks });
    });

    const dateRangeLabel = (() => {
        if (range === 'custom' && customFrom && customTo) return `${new Date(customFrom).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${new Date(customTo).toLocaleDateString(undefined, { dateStyle: 'medium' })}`;
        if (range === 'today') return new Date().toLocaleDateString(undefined, { dateStyle: 'full' });
        if (range === 'month') return `${new Date(Date.now() - 29 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return `${new Date(Date.now() - 6 * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    })();

    const attentionItems = [
        { label: 'Tasks with pending submission decisions', count: stats.pendingResolution, icon: statIcons.warning, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
        { label: 'Suspension appeals awaiting review', count: liveCounts.pendingAppeals, icon: statIcons.appeal, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', href: route('admin.appeals') },
        { label: 'Feedback tickets awaiting review', count: liveCounts.pendingFeedbacks, icon: statIcons.feedback, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', href: route('admin.feedbacks') },
    ];

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Admin Dashboard</h2>}>
            <Head title="Admin Dashboard" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="flex flex-wrap gap-3">
                        <Link href={route('admin.users')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Manage Users</Link>
                        <Link href={route('admin.projects')} className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">View Projects</Link>
                        <Link href={route('admin.feedbacks')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Feedback</Link>
                        <Link href={route('admin.appeals')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Appeals</Link>
                        <Link href={route('admin.logs')} className="ml-auto flex items-center gap-1.5 rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Administration Logs
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Total Users" value={stats.users} sub={`${stats.activeUsers} active · ${stats.inactiveUsers} inactive`} pct={stats.userGrowthRate} accentColor="text-indigo-600 dark:text-indigo-400" icon={statIcons.users} />
                        <StatCard label="Admins" value={stats.admins} sub="Users with elevated platform access" icon={statIcons.admins} />
                        <StatCard label="Projects" value={stats.projects} sub="Total projects created" pct={stats.projectGrowthRate} icon={statIcons.projects} />
                        <StatCard label="Tasks" value={stats.tasks} sub={`${stats.tasksByStatus.done ?? 0} completed`} pct={stats.taskGrowthRate} icon={statIcons.tasks} />
                        <StatCard label="New This Month" value={stats.newUsersThisMonth} sub="New user signups this month" icon={statIcons.newThisMonth} />
                        <StatCard label="Growth Rate" value={`${stats.userGrowthRate > 0 ? '+' : ''}${stats.userGrowthRate}%`} sub="User growth vs last month" accentColor={stats.userGrowthRate > 0 ? 'text-green-600 dark:text-green-400' : stats.userGrowthRate < 0 ? 'text-red-600 dark:text-red-400' : undefined} icon={statIcons.growth} />
                        <StatCard label="Currently Online" value={stats.currentlyOnline} sub="Active in the last 5 minutes" icon={statIcons.online} />
                        <StatCard label="Completed Projects" value={stats.completedProjects} sub="Every task in the project is done" icon={statIcons.completed} />
                    </div>

                    <AttentionPanel items={attentionItems} />

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <SectionHeading>Platform Activity</SectionHeading>
                            <RangeButtons range={range} routeName="admin.dashboard" customFrom={customFrom} customTo={customTo} />
                        </div>
                        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">{dateRangeLabel}</p>
                        <div className="text-gray-600 dark:text-gray-300">
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.25} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} allowDecimals={false} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ color: 'currentColor', paddingTop: 12 }} />
                                    <Area type="monotone" dataKey="completed" name="Tasks Done" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />
                                    <Line type="monotone" dataKey="created" name="Tasks Created" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                                    <Line type="monotone" dataKey="newProjects" name="New Projects" stroke="#ec4899" strokeWidth={2} dot={false} strokeDasharray="2 2" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <TasksByStatusCard tasksByStatus={stats.tasksByStatus} total={totalTasks} />

                    <div className="grid items-start gap-6 lg:grid-cols-2">
                        <RecentPanel title="Recent Users" viewAllHref={route('admin.users')} viewAllLabel="View all users">
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.recentUsers.map((user) => (
                                    <li key={user.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                                        <Avatar user={user} size="h-7 w-7" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                                            <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                                        </div>
                                        <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{user.role}</span>
                                    </li>
                                ))}
                            </ul>
                        </RecentPanel>

                        <RecentPanel title="Recent Projects" viewAllHref={route('admin.projects')} viewAllLabel="View all projects">
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats.recentProjects.map((project) => (
                                    <li key={project.id} className="py-2 first:pt-0 last:pb-0">
                                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{project.name}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">ID {project.id} · by {project.owner?.name}</p>
                                    </li>
                                ))}
                            </ul>
                        </RecentPanel>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}