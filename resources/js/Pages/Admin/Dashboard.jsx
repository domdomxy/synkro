import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import { Head, Link } from '@inertiajs/react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-semibold ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
    );
}

function RangeButtons({ range }) {
    return (
        <div className="flex gap-1">
            {Object.entries(rangeLabels).map(([key, label]) => (
                <Link
                    key={key}
                    href={route('admin.dashboard', { range: key })}
                    preserveScroll
                    className={`rounded-md px-3 py-1 text-xs ${
                        range === key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {label}
                </Link>
            ))}
        </div>
    );
}

export default function Dashboard({ stats, range }) {
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
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Total Users" value={stats.users} sub={`${stats.activeUsers} active · ${stats.inactiveUsers} inactive`} accent />
                        <StatCard label="Admins" value={stats.admins} />
                        <StatCard label="Projects" value={stats.projects} />
                        <StatCard label="Tasks" value={stats.tasks} sub={`${stats.tasksByStatus.done ?? 0} completed`} />
                    </div>

                    {stats.pendingResolution > 0 && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                ⚠️ {stats.pendingResolution} task{stats.pendingResolution > 1 ? 's' : ''} have pending submission decisions across the platform (member left or was removed while task was in progress).
                            </p>
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Platform Activity</h3>
                                    <RangeButtons range={range} />
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
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

                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
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
                                            <p className="text-xs text-gray-400 dark:text-gray-500">by {project.owner?.name}</p>
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