import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import SortableHeader from '@/Components/SortableHeader';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import BackButton from '@/Components/BackButton';
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

const DEFAULT_PER_PAGE = 10;
const FILTER_DEFAULTS = { per_page: DEFAULT_PER_PAGE, sort: 'name', direction: 'asc' };

export default function Projects({ projects, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || DEFAULT_PER_PAGE);
    const [sort, setSort] = useState(filters.sort ?? 'name');
    const [direction, setDirection] = useState(filters.direction ?? 'asc');

    const applyFilters = () => {
        router.get(route('admin.projects'), cleanParams({ search, per_page: perPage, sort, direction }, FILTER_DEFAULTS), { preserveState: true });
    };

    const clearFilters = () => {
        setSearch(''); setPerPage(DEFAULT_PER_PAGE); setSort('name'); setDirection('asc');
        router.get(route('admin.projects'));
    };

    const handlePerPageChange = (value) => {
        setPerPage(value);
        router.get(route('admin.projects'), cleanParams({ search, per_page: value, sort, direction }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    const handleSort = (column) => {
        const newDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';
        setSort(column);
        setDirection(newDirection);
        router.get(route('admin.projects'), cleanParams({ search, per_page: perPage, sort: column, direction: newDirection }, FILTER_DEFAULTS), { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('admin.dashboard')} label="Back to Admin Dashboard" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Projects</h2>
            </div>
        }>
            <Head title="Admin - Projects" />
            <div className="py-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <div className="relative w-full sm:w-72">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search by project name or owner..."
                                className="w-full pl-9"
                            />
                        </div>
                        <button onClick={applyFilters} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Filter</button>
                        {search && (
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                    </div>

                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        {projects.total} project{projects.total !== 1 ? 's' : ''} match{projects.total === 1 ? 'es' : ''} your search
                    </p>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="hidden sm:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <SortableHeader label="Name" column="name" sort={sort} direction={direction} onSort={handleSort} />
                                        <th className="px-6 py-3">Owner</th>
                                        <SortableHeader label="Members" column="members" sort={sort} direction={direction} onSort={handleSort} />
                                        <SortableHeader label="Tasks" column="tasks" sort={sort} direction={direction} onSort={handleSort} />
                                        <th className="px-6 py-3">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {projects.data.map((project) => (
                                        <tr key={project.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className="px-6 py-3 text-gray-400 dark:text-gray-500">#{project.id}</td>
                                            <td className="max-w-xs truncate px-6 py-3">
                                                <span className="text-gray-700 dark:text-gray-300" title={project.name}>{project.name}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {project.owner ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar user={project.owner} size="h-6 w-6" />
                                                        <span className="truncate text-gray-500 dark:text-gray-400">{project.owner.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">No owner</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 dark:text-gray-300">{project.members_count}</td>
                                            <td className="px-6 py-3 dark:text-gray-300">{project.tasks_count}</td>
                                            <td className="px-6 py-3">
                                                <Link
                                                    href={route('admin.projects.logs', project.id)}
                                                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    View Logs
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {projects.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                                No projects match your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* A 6-column table doesn't fit a phone screen usefully even with horizontal scroll
                           (constant back-and-forth to read one row) — a stacked card per project reads far
                           better below the sm breakpoint. */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 sm:hidden">
                            {projects.data.map((project) => (
                                <div key={project.id} className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400 dark:text-gray-500">#{project.id}</p>
                                            <p className="truncate font-medium text-gray-800 dark:text-gray-200" title={project.name}>{project.name}</p>
                                        </div>
                                        <Link
                                            href={route('admin.projects.logs', project.id)}
                                            className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Logs
                                        </Link>
                                    </div>

                                    <div className="mt-2 flex items-center gap-2">
                                        {project.owner ? (
                                            <>
                                                <Avatar user={project.owner} size="h-5 w-5" />
                                                <span className="truncate text-sm text-gray-500 dark:text-gray-400">{project.owner.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-500">No owner</span>
                                        )}
                                    </div>

                                    <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span><span className="font-medium text-gray-700 dark:text-gray-300">{project.members_count}</span> members</span>
                                        <span><span className="font-medium text-gray-700 dark:text-gray-300">{project.tasks_count}</span> tasks</span>
                                    </div>
                                </div>
                            ))}
                            {projects.data.length === 0 && (
                                <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                                    No projects match your search.
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                            <PerPageSelect value={perPage} onChange={handlePerPageChange} />
                            <Pagination meta={projects} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}