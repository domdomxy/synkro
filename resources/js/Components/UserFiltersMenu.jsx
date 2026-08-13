import FiltersMenu from '@/Components/FiltersMenu';
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

/**
 * Admin > Users' role/status/verification selects collapsed into a single
 * "Filters" button via the shared FiltersMenu component.
 */
export default function UserFiltersMenu({
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter,
    verifiedFilter, setVerifiedFilter,
    onClear, hasActiveFilters,
}) {
    const activeCount = [roleFilter !== 'all', statusFilter !== 'all', verifiedFilter !== 'all'].filter(Boolean).length;

    return (
        <FiltersMenu activeCount={activeCount} hasActiveFilters={hasActiveFilters} onClear={onClear}>
            <FiltersMenu.Row label="Role">
                <FilterSelect value={roleFilter} onChange={setRoleFilter} className="w-full" options={ROLE_OPTIONS} />
            </FiltersMenu.Row>
            <FiltersMenu.Row label="Status">
                <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full" options={STATUS_OPTIONS} />
            </FiltersMenu.Row>
            <FiltersMenu.Row label="Verification">
                <FilterSelect value={verifiedFilter} onChange={setVerifiedFilter} className="w-full" options={VERIFIED_OPTIONS} />
            </FiltersMenu.Row>
        </FiltersMenu>
    );
}
