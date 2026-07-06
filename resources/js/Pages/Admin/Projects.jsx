import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TextInput from '@/Components/TextInput';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

export default function Projects({ projects }) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return projects;
        return projects.filter((p) =>
            p.name.toLowerCase().includes(term) ||
            p.owner?.name?.toLowerCase().includes(term) ||
            p.owner?.email?.toLowerCase().includes(term)
        );
    }, [projects, search]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Projects</h2>}>
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
                                placeholder="Search by project name or owner..."
                                className="w-72 pl-9"
                            />
                        </div>
                        {search && (
                            <button onClick={() => setSearch('')} className="text-sm text-gray-500 hover:underline dark:text-gray-400">
                                Clear
                            </button>
                        )}
                    </div>

                    {projects.length > 0 && (
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                            {filtered.length} of {projects.length} project{projects.length > 1 ? 's' : ''}
                        </p>
                    )}

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Owner</th>
                                    <th className="px-6 py-3">Members</th>
                                    <th className="px-6 py-3">Tasks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filtered.map((project) => (
                                    <tr key={project.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/40">
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
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                            {projects.length === 0 ? 'No projects on the platform yet.' : 'No projects match your search.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}