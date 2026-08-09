import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import StatCard from '@/Components/StatCard';
import SortableHeader from '@/Components/SortableHeader';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import BackButton from '@/Components/BackButton';
import SuspendModal from '@/Components/SuspendModal';
import LiftSuspensionModal from '@/Components/LiftSuspensionModal';
import EditUserModal from '@/Components/EditUserModal';
import PerPageSelect from '@/Components/PerPageSelect';
import Pagination from '@/Components/Pagination';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import UserFiltersMenu from '@/Components/UserFiltersMenu';
import AdminConfirmationModal from '@/Components/AdminConfirmationModal';
import { cleanParams } from '@/utils/queryParams';
import useConfirm from '@/hooks/useConfirm';


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
    deleted: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    admins: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    superadmins: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z" /></svg>,
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
    if (user.deleted_at) return 'deleted';
    if (user.is_suspended) return 'suspended';
    if (!user.is_active) return 'inactive';
    return 'active';
}

function StatusBadge({ user }) {
    const status = getUserStatus(user);

    if (status === 'deleted') {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                title="Account deleted by the user; may still be within its restore window"
            >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                deleted
            </span>
        );
    }

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

function UserActionsMenu({ user, isSelf, isSuperAdmin, onToggleRole, onToggleSuperAdmin, onResetPassword, onSuspend, onLiftSuspension, onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const MENU_WIDTH = 200;
    const isDeleted = !!user.deleted_at;
    const isTargetSuperAdmin = user.role === 'superadmin';
    // Deleted accounts are gone from the app's own perspective - role, password,
    // and suspension no longer mean anything for them, so those actions are
    // disabled rather than hidden (keeps the menu's shape consistent).
    const disabled = isSelf || isDeleted;
    // Promoting/demoting admins, editing a user's info, and deleting accounts are
    // superadmin-only (a superadmin's own role also isn't managed from this menu).

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) });
        }
        setOpen((v) => !v);
    };

    // Once the menu has actually rendered we know its real height, so flip it to
    // open upward from the button instead of downward whenever there isn't
    // enough room below - this is what keeps it from spilling past the last
    // row in the table (or off the bottom of the viewport).
    useLayoutEffect(() => {
        if (!open || !menuRef.current || !btnRef.current) return;
        const menuHeight = menuRef.current.getBoundingClientRect().height;
        const btnRect = btnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;
        if (spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow) {
            setCoords((c) => ({ ...c, top: btnRect.top - menuHeight - 4 }));
        }
    }, [open]);

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
                    <Link
                        href={route('admin.users.logs', user.id)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        View Activity Logs
                    </Link>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    {isSuperAdmin && !isTargetSuperAdmin && (
                        <button
                            onClick={() => { setOpen(false); onToggleRole(user); }}
                            disabled={disabled}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                        </button>
                    )}
                    {isSuperAdmin && (user.role === 'admin' || isTargetSuperAdmin) && (
                        <button
                            onClick={() => { setOpen(false); onToggleSuperAdmin(user); }}
                            disabled={disabled}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-400 dark:hover:bg-amber-950/30"
                        >
                            {isTargetSuperAdmin ? 'Demote to Admin' : 'Promote to Superadmin'}
                        </button>
                    )}
                    {isSuperAdmin && !isTargetSuperAdmin && (
                        <button
                            onClick={() => { setOpen(false); onEdit(user); }}
                            disabled={isDeleted}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Edit Info
                        </button>
                    )}
                    <button
                        onClick={() => { setOpen(false); onResetPassword(user); }}
                        disabled={disabled}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Reset Password
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    {user.is_suspended ? (
                        <button
                            onClick={() => { setOpen(false); onLiftSuspension(user); }}
                            disabled={isDeleted}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-green-400 dark:hover:bg-green-950/30"
                        >
                            Lift Suspension
                        </button>
                    ) : (
                        <button
                            onClick={() => { setOpen(false); onSuspend(user); }}
                            disabled={disabled}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                            Suspend User
                        </button>
                    )}
                    {isSuperAdmin && !isTargetSuperAdmin && (
                        <>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                            <button
                                onClick={() => { setOpen(false); onDelete(user); }}
                                disabled={isSelf || isDeleted}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            >
                                Delete Account
                            </button>
                        </>
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
    const isSuperAdmin = auth.user.role === 'superadmin';
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [verifiedFilter, setVerifiedFilter] = useState(filters.verified ?? 'all');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || DEFAULT_PER_PAGE);
    const paginationRef = useRef(null);
    const [sort, setSort] = useState(filters.sort ?? 'name');
    const [direction, setDirection] = useState(filters.direction ?? 'asc');
    const [suspendTarget, setSuspendTarget] = useState(null);
    const [liftTarget, setLiftTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
    const [roleChangeTarget, setRoleChangeTarget] = useState(null);
    const { confirm, ConfirmDialog } = useConfirm();

    // Only accounts a superadmin could actually select for bulk delete: not
    // yourself, not another superadmin, not already deleted.
    const selectableUsers = users.data.filter((u) => u.id !== auth.user.id && u.role !== 'superadmin' && !u.deleted_at);
    const allSelectableSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id));

    const toggleSelected = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds(allSelectableSelected ? [] : selectableUsers.map((u) => u.id));
    };

    useEffect(() => {
        setSelectedIds([]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users]);

    const applyFilters = () => {
        router.get(route('admin.users'), cleanParams({ search, role: roleFilter, status: statusFilter, verified: verifiedFilter, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setVerifiedFilter('all'); setPerPage(DEFAULT_PER_PAGE); setSort('name'); setDirection('asc');
        router.get(route('admin.users'), {}, { preserveScroll: true });
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

    // Confirm first (cheap, no email sent yet), then stage the target - the actual
    // promotion/demotion only happens once the step-up code in AdminConfirmationModal
    // is verified, same pattern as permanent deletion below. Role changes are
    // sensitive enough (they're what hands out admin/superadmin access) that a plain
    // "are you sure" isn't enough on its own, but there's no reason to send a code
    // before the admin has even confirmed they want to do this.
    const toggleRole = async (user) => {
        const isPromotion = user.role !== 'admin';
        const action = isPromotion ? 'promote to admin' : 'demote to a regular user';
        if (!(await confirm(`Are you sure you want to ${action} ${user.name}?`, { title: isPromotion ? 'Promote to Admin?' : 'Demote User?' }))) return;
        setRoleChangeTarget({ route: 'admin.users.toggle-role', user, isPromotion, kind: 'admin' });
    };

    const toggleSuperAdmin = async (user) => {
        const isTargetSuperAdmin = user.role === 'superadmin';
        const isPromotion = !isTargetSuperAdmin;
        const action = isPromotion ? 'promote to superadmin' : 'demote to a regular admin';
        if (!(await confirm(`Are you sure you want to ${action} ${user.name}?`, { title: isPromotion ? 'Promote to Superadmin?' : 'Demote to Admin?' }))) return;
        setRoleChangeTarget({ route: 'admin.users.toggle-superadmin', user, isPromotion, kind: 'superadmin' });
    };

    const verifyAndChangeRole = (code) =>
        new Promise((resolve, reject) => {
            if (!roleChangeTarget) return reject();

            router.patch(route(roleChangeTarget.route, roleChangeTarget.user.id), { confirmation_code: code }, {
                preserveScroll: true,
                onSuccess: () => { setRoleChangeTarget(null); resolve(); },
                onError: (errors) => reject(errors.confirmation_code || errors.error || ''),
            });
        });

    const liftSuspension = (user) => setLiftTarget(user);

    const resetPassword = async (user) => {
        if (!(await confirm(`A new temporary password will be emailed to them, expiring in 24 hours.`, { title: `Reset ${user.name}'s Password?` }))) return;
        router.post(route('admin.users.reset-password', user.id), {}, { preserveScroll: true });
    };

    const deleteChoices = (count) => [
        {
            value: 'graceful',
            label: 'Move to trash',
            description: `${count === 1 ? 'The account' : 'Each account'} gets a grace period and can be restored by logging back in.`,
            icon: 'clock',
            confirmLabel: 'Delete',
            default: true,
        },
        {
            value: 'permanent',
            label: 'Delete permanently',
            description: `Immediate and unrecoverable - no grace period, no restore. ${count === 1 ? 'Only' : count} ${count === 1 ? 'use this if you\'re certain.' : 'accounts, permanently deleted.'}`,
            icon: 'trash',
            danger: true,
            confirmLabel: 'Delete Permanently',
        },
    ];

    const deleteUser = async (user) => {
        const mode = await confirm(`Choose how to delete ${user.name}'s account.`, {
            title: `Delete ${user.name}'s Account?`,
            cancelLabel: 'Cancel',
            choices: deleteChoices(1),
        });
        if (!mode) return;
        if (mode === 'permanent') {
            setPermanentDeleteTarget({ type: 'single', user });
            return;
        }
        router.delete(route('admin.users.destroy', user.id), { data: { mode }, preserveScroll: true });
    };

    const deleteSelected = async () => {
        const count = selectedIds.length;
        const mode = await confirm(`Choose how to delete ${count} account${count !== 1 ? 's' : ''}.`, {
            title: `Delete ${count} Account${count !== 1 ? 's' : ''}?`,
            cancelLabel: 'Cancel',
            choices: deleteChoices(count),
        });
        if (!mode) return;
        if (mode === 'permanent') {
            setPermanentDeleteTarget({ type: 'bulk', ids: selectedIds, count });
            return;
        }
        router.delete(route('admin.users.destroy-bulk'), {
            data: { user_ids: selectedIds, mode },
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    // Called by AdminConfirmationModal once a 6-digit code has been entered - the
    // code is what actually authorizes the permanent delete server-side; this just
    // submits it alongside the original target(s) and surfaces any rejection back
    // into the modal (wrong/expired code, too many attempts, etc).
    const verifyAndDeletePermanently = (code) =>
        new Promise((resolve, reject) => {
            if (!permanentDeleteTarget) return reject();

            const onError = (errors) => reject(errors.confirmation_code || errors.error || '');

            if (permanentDeleteTarget.type === 'single') {
                router.delete(route('admin.users.destroy', permanentDeleteTarget.user.id), {
                    data: { mode: 'permanent', confirmation_code: code },
                    preserveScroll: true,
                    onSuccess: () => { setPermanentDeleteTarget(null); resolve(); },
                    onError,
                });
            } else {
                router.delete(route('admin.users.destroy-bulk'), {
                    data: { user_ids: permanentDeleteTarget.ids, mode: 'permanent', confirmation_code: code },
                    preserveScroll: true,
                    onSuccess: () => { setSelectedIds([]); setPermanentDeleteTarget(null); resolve(); },
                    onError,
                });
            }
        });

    return (
        <AuthenticatedLayout header={
        <div className="flex items-center gap-4">
            <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Users</h2>
        </div>
        }>
            <Head title="Admin - Users" />
            <div className="py-12">
                <div className="mx-auto max-w-8xl space-y-6 px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <StatCard label="Total Users" value={stats.total} sub={`${stats.newUsersThisMonth} new this month`} pct={stats.userGrowthRate} accentColor="text-indigo-600 dark:text-indigo-400" icon={statIcons.total} />
                        <StatCard label="Active" value={stats.active} sub={`${stats.activeRatio}% of all users`} pct={stats.activeTrend} accentColor="text-green-600 dark:text-green-400" icon={statIcons.active} />
                        <StatCard label="Inactive" value={stats.inactive} sub={`${stats.inactiveRatio}% of all users`} pct={stats.inactiveTrend} accentColor="text-gray-500 dark:text-gray-400" icon={statIcons.inactive} />
                        <StatCard label="Suspended" value={stats.suspended} sub={`${stats.suspendedRatio}% of all users`} pct={stats.suspendedTrend} accentColor="text-red-600 dark:text-red-400" icon={statIcons.suspended} />
                        <StatCard label="Deleted" value={stats.deleted} sub={`${stats.deletedRatio}% of all users, in grace period`} accentColor="text-rose-600 dark:text-rose-400" icon={statIcons.deleted} />
                        <StatCard label="Admins" value={stats.admins} sub={`${stats.adminsRatio}% of all users`} pct={stats.adminsTrend} accentColor="text-purple-600 dark:text-purple-400" icon={statIcons.admins} />
                        <StatCard label="Superadmins" value={stats.superadmins} sub={`${stats.superadminsRatio}% of all users`} pct={stats.superadminsTrend} accentColor="text-amber-600 dark:text-amber-400" icon={statIcons.superadmins} />
                        <StatCard label="Verified" value={stats.verified} sub={`${stats.verifiedRatio}% of all users`} pct={stats.verifiedTrend} accentColor="text-teal-600 dark:text-teal-400" icon={statIcons.verified} />
                        <StatCard label="Unverified" value={stats.unverified} sub={`${stats.unverifiedRatio}% of all users`} accentColor="text-amber-600 dark:text-amber-400" icon={statIcons.unverified} />
                        <StatCard label="New This Month" value={stats.newUsersThisMonth} sub="Signups since the 1st" icon={statIcons.newThisMonth} />
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
                                    placeholder="Search by name, email, or ID..."
                                    className="w-64 pl-9"
                                />
                            </div>
                            <UserFiltersMenu
                                roleFilter={roleFilter}
                                setRoleFilter={setRoleFilter}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                verifiedFilter={verifiedFilter}
                                setVerifiedFilter={setVerifiedFilter}
                                onApply={applyFilters}
                                onClear={clearFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            {users.total} user{users.total !== 1 ? 's' : ''} match{users.total === 1 ? 'es' : ''} your filters
                        </p>
                    </div>

                    <div ref={paginationRef} className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
                        <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                        <Pagination meta={users} />
                    </div>

                    {isSuperAdmin && selectedIds.length > 0 && (
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-4 py-3 shadow dark:bg-rose-950/40">
                            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                                {selectedIds.length} account{selectedIds.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedIds([])} className="text-sm text-rose-600 hover:underline dark:text-rose-400">Clear selection</button>
                                <button onClick={deleteSelected} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500">
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
                        <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    {isSuperAdmin && (
                                        <th className="w-10 px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelectableSelected}
                                                onChange={toggleSelectAll}
                                                disabled={selectableUsers.length === 0}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                        </th>
                                    )}
                                    <SortableHeader label="ID" column="id" sort={sort} direction={direction} onSort={handleSort} />
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
                                            {isSuperAdmin && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(user.id)}
                                                        onChange={() => toggleSelected(user.id)}
                                                        disabled={isSelf || user.role === 'superadmin' || !!user.deleted_at}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-3 font-mono text-sm text-gray-400 dark:text-gray-500">
                                                #{user.id}
                                            </td>
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
                                                <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs capitalize ${user.role === 'superadmin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {user.role === 'superadmin' ? 'Super Admin' : user.role}
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
                                                    isSuperAdmin={isSuperAdmin}
                                                    onToggleRole={toggleRole}
                                                    onToggleSuperAdmin={toggleSuperAdmin}
                                                    onResetPassword={resetPassword}
                                                    onSuspend={setSuspendTarget}
                                                    onLiftSuspension={liftSuspension}
                                                    onEdit={setEditTarget}
                                                    onDelete={deleteUser}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                            No users match your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
            <EditUserModal
                user={editTarget}
                show={editTarget !== null}
                onClose={() => setEditTarget(null)}
            />
            {ConfirmDialog}
            <AdminConfirmationModal
                show={permanentDeleteTarget !== null}
                purpose="users.delete_permanent"
                title={permanentDeleteTarget?.type === 'single' ? `Confirm Permanent Deletion` : `Confirm Permanent Deletion of ${permanentDeleteTarget?.count} Accounts`}
                description={
                    permanentDeleteTarget?.type === 'single'
                        ? `This will immediately and permanently delete ${permanentDeleteTarget?.user?.name}'s account - no grace period, no restore.`
                        : `This will immediately and permanently delete ${permanentDeleteTarget?.count} account${permanentDeleteTarget?.count !== 1 ? 's' : ''} - no grace period, no restore.`
                }
                confirmLabel="Delete Permanently"
                onVerify={verifyAndDeletePermanently}
                onClose={() => setPermanentDeleteTarget(null)}
            />
            <AdminConfirmationModal
                show={roleChangeTarget !== null}
                purpose="users.role_change"
                title={
                    roleChangeTarget?.kind === 'superadmin'
                        ? (roleChangeTarget?.isPromotion ? 'Promote to Superadmin?' : 'Demote to Admin?')
                        : (roleChangeTarget?.isPromotion ? 'Promote to Admin?' : 'Demote User?')
                }
                description={
                    roleChangeTarget?.kind === 'superadmin'
                        ? `This will ${roleChangeTarget?.isPromotion ? 'grant' : 'remove'} superadmin access ${roleChangeTarget?.isPromotion ? 'to' : 'from'} ${roleChangeTarget?.user?.name}.`
                        : `This will ${roleChangeTarget?.isPromotion ? 'grant' : 'remove'} admin access ${roleChangeTarget?.isPromotion ? 'to' : 'from'} ${roleChangeTarget?.user?.name}.`
                }
                confirmLabel={roleChangeTarget?.isPromotion ? 'Promote' : 'Demote'}
                danger={!roleChangeTarget?.isPromotion}
                onVerify={verifyAndChangeRole}
                onClose={() => setRoleChangeTarget(null)}
            />
            <ScrollToPaginationButton targetRef={paginationRef} />
        </AuthenticatedLayout>
    );
}