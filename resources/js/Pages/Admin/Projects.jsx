import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import BackButton from '@/Components/BackButton';

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function Pagination({ links }) {
    if (!links) return null;
    return (
        <div className="flex flex-wrap justify-center gap-2 py-4">
            {links.map((link, i) => (
                <button
                    key={i}
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                    className={`rounded-md px-3 py-1 text-sm ${
                        link.active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </div>
    );
}

export default function Projects({ projects, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = () => {
        router.get(route('admin.projects'), { search }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        router.get(route('admin.projects'));
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
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                <SearchIcon />
                            </div>
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search by project name or owner..."
                                className="w-72 pl-9"
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
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Owner</th>
                                    <th className="px-6 py-3">Members</th>
                                    <th className="px-6 py-3">Tasks</th>
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
                        <Pagination links={projects.links} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}