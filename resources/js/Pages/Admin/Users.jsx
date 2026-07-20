import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import StatCard from '@/Components/StatCard';
import SortableHeader from '@/Components/SortableHeader';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import BackButton from '@/Components/BackButton';
import SuspendModal from '@/Components/SuspendModal';
import LiftSuspensionModal from '@/Components/LiftSuspensionModal';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import FilterSelect from '@/Components/FilterSelect';
import { cleanParams } from '@/utils/queryParams';


function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

const statIcons = {
    total: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 3a4 4 0 10-4-4" /></svg>,
    active: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM17 9l2 2 4-4" /></svg>,
    inactive: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM18 8l4 4m0-4l-4 4" /></svg>,
    suspended: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728zM5.636 5.636l12.728 12.728" /></svg>,
    admins: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    verified: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>,
    unverified: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    newThisMonth: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
};

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
const FILTER_DEFAULTS = { role: 'all', status: 'all', verified: 'all', per_page: DEFAULT_PER_PAGE, sort: 'name', direction: 'asc' };

export default function Users({ users, stats, filters }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [verifiedFilter, setVerifiedFilter] = useState(filters.verified ?? 'all');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || DEFAULT_PER_PAGE);
    const [sort, setSort] = useState(filters.sort ?? 'name');
    const [direction, setDirection] = useState(filters.direction ?? 'asc');
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [liftTarget, setLiftTarget] = useState(null);

    const applyFilters = () => {
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, verified: verifiedFilter, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setVerifiedFilter('all'); setPerPage(DEFAULT_PER_PAGE); setSort('name'); setDirection('asc');
        router.get(route('admin.users'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, verified: verifiedFilter, per_page: value, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleSort = (column) => {
        const newDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';
        setSort(column);
        setDirection(newDirection);
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, verified: verifiedFilter, per_page: perPage, sort: column, direction: newDirection }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = search !== '' || roleFilter !== 'all' || statusFilter !== 'all' || verifiedFilter !== 'all';

    const toggleRole = (user) => {
        const action = user.role === 'admin' ? 'demote to a regular user' : 'promote to admin';
        if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
        router.patch(route('admin.users.toggle-role', user.id), {}, { preserveScroll: true });
    };

    const liftSuspension = (user) => setLiftTarget(user);

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

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Total Users" value={stats.total} sub={`${stats.newUsersThisMonth} new this month`} pct={stats.userGrowthRate} accentColor="text-indigo-600 dark:text-indigo-400" icon={statIcons.total} />
                        <StatCard label="Active" value={stats.active} sub={`${stats.activeRatio}% of all users`} pct={stats.activeTrend} accentColor="text-green-600 dark:text-green-400" icon={statIcons.active} />
                        <StatCard label="Inactive" value={stats.inactive} sub={`${stats.inactiveRatio}% of all users`} pct={stats.inactiveTrend} accentColor="text-gray-500 dark:text-gray-400" icon={statIcons.inactive} />
                        <StatCard label="Suspended" value={stats.suspended} sub={`${stats.suspendedRatio}% of all users`} pct={stats.suspendedTrend} accentColor="text-red-600 dark:text-red-400" icon={statIcons.suspended} />
                        <StatCard label="Admins" value={stats.admins} sub={`${stats.adminsRatio}% of all users`} pct={stats.adminsTrend} accentColor="text-purple-600 dark:text-purple-400" icon={statIcons.admins} />
                        <StatCard label="Verified" value={stats.verified} sub={`${stats.verifiedRatio}% of all users`} pct={stats.verifiedTrend} accentColor="text-teal-600 dark:text-teal-400" icon={statIcons.verified} />
                        <StatCard label="Unverified" value={stats.unverified} sub={`${stats.unverifiedRatio}% of all users`} accentColor="text-amber-600 dark:text-amber-400" icon={statIcons.unverified} />
                        <StatCard label="New This Month" value={stats.newUsersThisMonth} sub="New signups this month" icon={statIcons.newThisMonth} />
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
                            <FilterSelect
                                value={roleFilter}
                                onChange={setRoleFilter}
                                className="w-36"
                                options={[
                                    { value: 'all', label: 'All Roles' },
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'user', label: 'User' },
                                ]}
                            />
                            <FilterSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                className="w-44"
                                options={[
                                    { value: 'all', label: 'All Statuses' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                    { value: 'suspended', label: 'Suspended' },
                                ]}
                            />
                            <FilterSelect
                                value={verifiedFilter}
                                onChange={setVerifiedFilter}
                                className="w-52"
                                options={[
                                    { value: 'all', label: 'Verified & Unverified' },
                                    { value: 'verified', label: 'Verified Only' },
                                    { value: 'unverified', label: 'Unverified Only' },
                                ]}
                            />
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
                        <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <SortableHeader label="User" column="name" sort={sort} direction={direction} onSort={handleSort} />
                                    <SortableHeader label="Role" column="role" sort={sort} direction={direction} onSort={handleSort} />
                                    <th className="px-6 py-3">Status</th>
                                    <SortableHeader label="Joined" column="joined" sort={sort} direction={direction} onSort={handleSort} />
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
                                                        {user.email_verified_at ? (
                                                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Verified
                                                            </span>
                                                        ) : (
                                                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400" title="Hasn't clicked the verification link in their email yet">
                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Unverified
                                                            </span>
                                                        )}
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
                        </div>
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
            <LiftSuspensionModal
                user={liftTarget}
                show={liftTarget !== null}
                onClose={() => setLiftTarget(null)}
            />
        </AuthenticatedLayout>
    );
}