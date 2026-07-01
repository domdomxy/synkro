import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function Users({ users }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const maxOwned = Math.max(1, ...users.map((u) => u.owned_projects_count));

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return users.filter((u) => {
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            if (statusFilter === 'active' && !u.is_active) return false;
            if (statusFilter === 'inactive' && u.is_active) return false;
            if (!term) return true;
            return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
        });
    }, [users, search, roleFilter, statusFilter]);

    const toggleActive = (user) => router.patch(route('admin.users.toggle-active', user.id));
    const toggleRole = (user) => router.patch(route('admin.users.toggle-role', user.id));
    const clearFilters = () => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Users</h2>}>
            <Head title="Admin - Users" />
            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-64" />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear filters</button>
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
                                {filtered.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar user={user} size="h-9 w-9" />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`rounded-full px-2 py-1 text-xs ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                                                {user.is_active ? 'active' : 'inactive'}
                                            </span>
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
                                            <div className="flex gap-2">
                                                <SecondaryButton onClick={() => toggleRole(user)}>
                                                    {user.role === 'admin' ? 'Demote' : 'Make Admin'}
                                                </SecondaryButton>
                                                <DangerButton onClick={() => toggleActive(user)}>
                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                </DangerButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={6} className="px-6 py-6 text-center text-gray-400 dark:text-gray-500">No users match your filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}