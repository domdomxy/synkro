import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import BackButton from '@/Components/BackButton';

const DURATION_OPTIONS = [
    { value: '1', label: '1 day' },
    { value: '3', label: '3 days' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: 'custom', label: 'Custom date...' },
    { value: 'permanent', label: 'Permanent' },
];

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function StatPill({ label, value, accent }) {
    return (
        <div className="rounded-lg bg-white px-4 py-3 shadow dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-0.5 text-xl font-semibold ${accent ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        </div>
    );
}

function timeRemaining(dateString) {
    const ms = new Date(dateString) - new Date();
    if (ms <= 0) return 'expiring soon';
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days} days left`;
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    return `${hours}h left`;
}

// Determines the single, unambiguous status shown for a user.
// Suspension (admin-imposed) always takes priority over self-deactivation,
// since a suspended user can't log in to reactivate themselves anyway.
function getUserStatus(user) {
    if (user.is_suspended) return 'suspended';
    if (!user.is_active) return 'inactive';
    return 'active';
}

function StatusBadge({ user }) {
    const status = getUserStatus(user);

    if (status === 'suspended') {
        const permanent = !user.suspended_until;
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {permanent ? 'suspended (permanent)' : `suspended · ${timeRemaining(user.suspended_until)}`}
            </span>
        );
    }

    if (status === 'inactive') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300" title="Deactivated by the user; reactivates automatically on their next login">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                inactive
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            active
        </span>
    );
}

function SuspendModal({ user, show, onClose }) {
    const form = useForm({ duration: '7', custom_date: '', reason: '' });

    const submit = (e) => {
        e.preventDefault();
        if (!confirm(`Suspend ${user?.name}? ${form.data.duration === 'permanent' ? 'This will be permanent until manually lifted.' : ''}`)) return;
        form.post(route('admin.users.suspend', user.id), {
            onSuccess: () => { form.reset(); onClose(); },
        });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Suspend {user?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    They won't be able to log in until the suspension is lifted or expires.
                </p>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
                    <select
                        value={form.data.duration}
                        onChange={(e) => form.setData('duration', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        {DURATION_OPTIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>

                {form.data.duration === 'custom' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Suspended until</label>
                        <TextInput
                            type="datetime-local"
                            value={form.data.custom_date}
                            onChange={(e) => form.setData('custom_date', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={form.errors.custom_date} className="mt-2" />
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reason <span className="font-normal text-gray-400">(optional, shown to the user)</span>
                    </label>
                    <textarea
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        placeholder="e.g. Violation of community guidelines"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton disabled={form.processing}>Suspend</DangerButton>
                </div>
            </form>
        </Modal>
    );
}

export default function Users({ users }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [suspendTarget, setSuspendTarget] = useState(null);

    const maxOwned = Math.max(1, ...users.map((u) => u.owned_projects_count));

    const stats = useMemo(() => ({
        total: users.length,
        active: users.filter((u) => getUserStatus(u) === 'active').length,
        inactive: users.filter((u) => getUserStatus(u) === 'inactive').length,
        suspended: users.filter((u) => getUserStatus(u) === 'suspended').length,
        admins: users.filter((u) => u.role === 'admin').length,
    }), [users]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (statusFilter !== 'all' && getUserStatus(u) !== statusFilter) return false;
            if (!term) return true;
            return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
        });
    }, [users, search, roleFilter, statusFilter]);

    const toggleRole = (user) => {
        const action = user.role === 'admin' ? 'demote to a regular user' : 'promote to admin';
        if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
        router.patch(route('admin.users.toggle-role', user.id));
    };

    const liftSuspension = (user) => {
        if (!confirm(`Lift the suspension on ${user.name}? They'll be able to log in immediately.`)) return;
        router.post(route('admin.users.lift-suspension', user.id));
    };

    const clearFilters = () => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); };
    const hasActiveFilters = search !== '' || roleFilter !== 'all' || statusFilter !== 'all';

    return (
        <AuthenticatedLayout header={
                <div className="flex items-center gap-4">
                    <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Users</h2>
                </div>
            }>
            <Head title="Admin - Users" />
            <div className="py-12">
                <div className="mx-auto max-w-6xl space-y-6 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <StatPill label="Total Users" value={stats.total} />
                        <StatPill label="Active" value={stats.active} accent="text-green-600 dark:text-green-400" />
                        <StatPill label="Inactive" value={stats.inactive} accent="text-gray-500 dark:text-gray-400" />
                        <StatPill label="Suspended" value={stats.suspended} accent="text-red-600 dark:text-red-400" />
                        <StatPill label="Admins" value={stats.admins} accent="text-purple-600 dark:text-purple-400" />
                    </div>

                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                    <SearchIcon />
                                </div>
                                <TextInput
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-64 pl-9"
                                />
                            </div>
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear filters</button>
                            )}
                        </div>
                        {users.length > 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {filtered.length} of {users.length} user{users.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Owned Projects</th>
                                    <th className="px-6 py-3">Joined</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filtered.map((user) => {
                                    const isSelf = user.id === auth.user.id;
                                    const status = getUserStatus(user);
                                    return (
                                        <tr key={user.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar user={user} size="h-9 w-9" />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                                                            {user.name}
                                                            {isSelf && <span className="ml-1.5 text-xs font-normal text-gray-400">(you)</span>}
                                                        </p>
                                                        <p className="truncate text-gray-500 dark:text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`rounded-full px-2 py-1 text-xs capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <StatusBadge user={user} />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-20 rounded-full bg-gray-100 dark:bg-gray-700">
                                                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${(user.owned_projects_count / maxOwned) * 100}%` }} />
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{user.owned_projects_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <SecondaryButton
                                                        onClick={() => toggleRole(user)}
                                                        disabled={isSelf}
                                                        title={isSelf ? "You can't change your own role" : undefined}
                                                    >
                                                        {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                                                    </SecondaryButton>
                                                    {status === 'suspended' ? (
                                                        <PrimaryButton onClick={() => liftSuspension(user)}>
                                                            Lift Suspension
                                                        </PrimaryButton>
                                                    ) : (
                                                        <DangerButton
                                                            onClick={() => setSuspendTarget(user)}
                                                            disabled={isSelf}
                                                            title={isSelf ? "You can't suspend your own account" : undefined}
                                                        >
                                                            Suspend
                                                        </DangerButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                            {users.length === 0 ? 'No users on the platform yet.' : 'No users match your filters.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <SuspendModal
                user={suspendTarget}
                show={suspendTarget !== null}
                onClose={() => setSuspendTarget(null)}
            />
        </AuthenticatedLayout>
    );
}