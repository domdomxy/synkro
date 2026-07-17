import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import BackButton from '@/Components/BackButton';
import SuspendModal from '@/Components/SuspendModal';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import { cleanParams } from '@/utils/queryParams';


function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

const statPillIcons = {
    total: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-4-4" /></svg>,
    active: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM17 9l2 2 4-4" /></svg>,
    inactive: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM18 8l4 4m0-4l-4 4" /></svg>,
    suspended: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM5.636 5.636l12.728 12.728" /></svg>,
    admins: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function StatPill({ label, value, accent, icon }) {
    return (
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                {icon && (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 ${accent ?? 'text-gray-500 dark:text-gray-400'}`}>
                        {icon}
                    </div>
                )}
            </div>
            <p className={`mt-2.5 text-3xl font-bold tracking-tight ${accent ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
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

function UserActionsMenu({ user, isSelf, onToggleRole, onResetPassword, onSuspend, onLiftSuspension }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 200;

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
        }
        setOpen((v) => !v);
    };

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleScroll = () => setOpen(false);
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
                Actions
                <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
                    className="z-50 overflow-hidden rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
                >
                    <button
                        onClick={() => { setOpen(false); onToggleRole(user); }}
                        disabled={isSelf}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    </button>
                    <button
                        onClick={() => { setOpen(false); onResetPassword(user); }}
                        disabled={isSelf}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Reset Password
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    {user.is_suspended ? (
                        <button
                            onClick={() => { setOpen(false); onLiftSuspension(user); }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                        >
                            Lift Suspension
                        </button>
                    ) : (
                        <button
                            onClick={() => { setOpen(false); onSuspend(user); }}
                            disabled={isSelf}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                            Suspend User
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { role: 'all', status: 'all', per_page: DEFAULT_PER_PAGE };

export default function Users({ users, stats, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || DEFAULT_PER_PAGE);
    const [suspendTarget, setSuspendTarget] = useState(null);

    const applyFilters = () => {
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, per_page: perPage }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setPerPage(DEFAULT_PER_PAGE);
        router.get(route('admin.users'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, per_page: value }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = search !== '' || roleFilter !== 'all' || statusFilter !== 'all';

    const toggleRole = (user) => {
        const action = user.role === 'admin' ? 'demote to a regular user' : 'promote to admin';
        if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
        router.patch(route('admin.users.toggle-role', user.id), {}, { preserveScroll: true });
    };

    const liftSuspension = (user) => {
        if (!confirm(`Lift the suspension on ${user.name}? They'll be able to log in immediately.`)) return;
        router.post(route('admin.users.lift-suspension', user.id), {}, { preserveScroll: true });
    };

    const resetPassword = (user) => {
        if (!confirm(`Reset ${user.name}'s password? A new temporary password will be emailed to them, expiring in 24 hours.`)) return;
        router.post(route('admin.users.reset-password', user.id), {}, { preserveScroll: true });
    };

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
                        <StatPill label="Total Users" value={stats.total} icon={statPillIcons.total} />
                        <StatPill label="Active" value={stats.active} accent="text-green-600 dark:text-green-400" icon={statPillIcons.active} />
                        <StatPill label="Inactive" value={stats.inactive} accent="text-gray-500 dark:text-gray-400" icon={statPillIcons.inactive} />
                        <StatPill label="Suspended" value={stats.suspended} accent="text-red-600 dark:text-red-400" icon={statPillIcons.suspended} />
                        <StatPill label="Admins" value={stats.admins} accent="text-purple-600 dark:text-purple-400" icon={statPillIcons.admins} />
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
                                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
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
                            <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear filters</button>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {users.total} user{users.total !== 1 ? 's' : ''} match{users.total === 1 ? 'es' : ''} your filters
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Joined</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {users.data.map((user) => {
                                    const isSelf = user.id === auth.user.id;
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
                                            <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-3">
                                                <UserActionsMenu
                                                    user={user}
                                                    isSelf={isSelf}
                                                    onToggleRole={toggleRole}
                                                    onResetPassword={resetPassword}
                                                    onSuspend={setSuspendTarget}
                                                    onLiftSuspension={liftSuspension}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                            No users match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                            <Pagination meta={users} />
                        </div>
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