import { useContext } from 'react';
import Dropdown, { DropDownContext } from '@/Components/Dropdown';
import FilterSelect from '@/Components/FilterSelect';

const ROLE_OPTIONS = [
    { value: 'all', label: 'All Roles' },
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
];
const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'deleted', label: 'Deleted' },
];
const VERIFIED_OPTIONS = [
    { value: 'all', label: 'Verified & Unverified' },
    { value: 'verified', label: 'Verified Only' },
    { value: 'unverified', label: 'Unverified Only' },
];

// Rendered as a child of Dropdown.Content so it sits inside DropDownContext's
// provider tree and can close the panel itself after Apply/Clear, the same
// way AccountMenu closes itself on navigation instead of relying on a
// blanket "close on any click inside" handler.
function PanelBody({ roleFilter, setRoleFilter, statusFilter, setStatusFilter, verifiedFilter, setVerifiedFilter, onApply, onClear, hasActiveFilters }) {
    const { setOpen } = useContext(DropDownContext);

    return (
        <div className="w-64 space-y-3">
            <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Role</p>
                <FilterSelect value={roleFilter} onChange={setRoleFilter} className="w-full" options={ROLE_OPTIONS} />
            </div>
            <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Status</p>
                <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full" options={STATUS_OPTIONS} />
            </div>
            <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Verification</p>
                <FilterSelect value={verifiedFilter} onChange={setVerifiedFilter} className="w-full" options={VERIFIED_OPTIONS} />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => { onApply(); setOpen(false); }}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                    Apply Filters
                </button>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={() => { onClear(); setOpen(false); }}
                        className="text-xs text-gray-500 hover:underline dark:text-gray-400"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Collapses the Admin > Users role/status/verification selects into a single
 * "Filters" button, the same treatment as ChartControlsMenu on the
 * dashboards. Search stays outside the menu, unchanged, since it's the
 * control people reach for first and typing in it doesn't need a click to
 * open anything. A small badge on the trigger counts how many of the three
 * selects are off their "all" default, so the filtered state is still
 * visible at a glance without opening the panel.
 */
export default function UserFiltersMenu({
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    verifiedFilter, setVerifiedFilter,
    onApply, onClear, hasActiveFilters,
}) {
    const activeCount = [roleFilter !== 'all', statusFilter !== 'all', verifiedFilter !== 'all'].filter(Boolean).length;

    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12M3 6h18M9 18h6" />
                    </svg>
                    Filters
                    {activeCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
                            {activeCount}
                        </span>
                    )}
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content align="left" width="auto" contentClasses="w-max max-w-[calc(100vw-2rem)] bg-white p-3 dark:bg-gray-800">
                <PanelBody
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    verifiedFilter={verifiedFilter}
                    setVerifiedFilter={setVerifiedFilter}
                    onApply={onApply}
                    onClear={onClear}
                    hasActiveFilters={hasActiveFilters}
                />
            </Dropdown.Content>
        </Dropdown>
    );
}
