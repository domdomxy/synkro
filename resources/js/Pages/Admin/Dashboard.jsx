import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import { Head, Link, router } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
 
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
    users: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-4-4" />
        </svg>
    ),
    admins: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    projects: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    tasks: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
};
 
function StatCard({ label, value, sub, accent, icon }) {
    return (
        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`mt-1 text-3xl font-semibold ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
                </div>
                {icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-400'}`}>
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
                <Link key={key} href={route(routeName, { range: key })} preserveScroll
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
 
export default function Dashboard({ stats, range, customFrom, customTo }) {
    const totalTasks = stats.tasks;
 
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Admin Dashboard</h2>}>
            <Head title="Admin Dashboard" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
 
                    <div className="flex flex-wrap gap-3">
                        <Link href={route('admin.users')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Manage Users
                        </Link>
                        <Link href={route('admin.projects')} className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
                            View Projects
                        </Link>
                        <Link href={route('admin.feedbacks')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Feedback
                        </Link>
                        <Link href={route('admin.appeals')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Appeals
                        </Link>
                    </div>
 
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Total Users" value={stats.users} sub={`${stats.activeUsers} active · ${stats.inactiveUsers} inactive`} accent icon={statIcons.users} />
                        <StatCard label="Admins" value={stats.admins} icon={statIcons.admins} />
                        <StatCard label="Projects" value={stats.projects} icon={statIcons.projects} />
                        <StatCard label="Tasks" value={stats.tasks} sub={`${stats.tasksByStatus.done ?? 0} completed`} icon={statIcons.tasks} />
                    </div>
 
                    {stats.pendingResolution > 0 && (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                {stats.pendingResolution} task{stats.pendingResolution > 1 ? 's' : ''} have pending submission decisions across the platform (member left or was removed while task was in progress).
                            </p>
                        </div>
                    )}
                    
                    {stats.pendingAppeals > 0 && (
                        <div className="flex items-start gap-3 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950/30">
                            <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {stats.pendingAppeals} suspension appeal{stats.pendingAppeals > 1 ? 's' : ''} awaiting review.
                            </p>
                        </div>
                    )}
 
                    {stats.pendingFeedbacks > 0 && (
                        <div className="flex items-start gap-3 rounded-lg border border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-700 dark:bg-indigo-950/30">
                            <svg className="h-5 w-5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                                {stats.pendingFeedbacks} feedback ticket{stats.pendingFeedbacks > 1 ? 's' : ''} awaiting review.
                            </p>
                        </div>
                    )}
 
                    {/* Activity trend — full width */}
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Platform Activity</h3>
                            <RangeButtons range={range} routeName="admin.dashboard" customFrom={customFrom} customTo={customTo} />
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.25} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="completed" name="Tasks Done" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />
                                <Line type="monotone" dataKey="created" name="Tasks Created" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                                <Line type="monotone" dataKey="newProjects" name="New Projects" stroke="#ec4899" strokeWidth={2} dot={false} strokeDasharray="2 2" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
 
                    {/* Status breakdown + recent activity */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 lg:col-span-2">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks by Status</h3>
                            <div className="space-y-2">
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColors[key]}`} />
                                        <span className="w-28 text-sm text-gray-600 dark:text-gray-400">{label}</span>
                                        <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className={`h-2 rounded-full ${statusColors[key]}`}
                                                style={{ width: `${totalTasks ? ((stats.tasksByStatus[key] ?? 0) / totalTasks) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right text-sm text-gray-500 dark:text-gray-400">{stats.tasksByStatus[key] ?? 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
 
                        <div className="space-y-6">
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Recent Users</h3>
                                <ul className="space-y-2">
                                    {stats.recentUsers.map((user) => (
                                        <li key={user.id} className="flex items-center gap-2">
                                            <Avatar user={user} size="h-7 w-7" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                                                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
                                            </div>
                                            <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {user.role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href={route('admin.users')} className="mt-3 block text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                                    View all users →
                                </Link>
                            </div>
 
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Recent Projects</h3>
                                <ul className="space-y-2">
                                    {stats.recentProjects.map((project) => (
                                        <li key={project.id}>
                                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{project.name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">ID {project.id} · by {project.owner?.name}</p>
                                        </li>
                                    ))}
                                </ul>
                                <Link href={route('admin.projects')} className="mt-3 block text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                                    View all projects →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}