import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

    const destroy = (project) => {
        if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
            router.delete(route('admin.projects.destroy', project.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Projects</h2>}>
            <Head title="Admin - Projects" />
            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project name or owner..." className="w-72" />
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Owner</th>
                                    <th className="px-6 py-3">Members</th>
                                    <th className="px-6 py-3">Tasks</th>
                                    <th className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {filtered.map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-6 py-3">
                                            <span className="text-gray-700 dark:text-gray-300">{project.name}</span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{project.owner?.name ?? 'No owner'}</td>
                                        <td className="px-6 py-3 dark:text-gray-300">{project.members_count}</td>
                                        <td className="px-6 py-3 dark:text-gray-300">{project.tasks_count}</td>
                                        <td className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500">View only</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-400 dark:text-gray-500">No projects match your search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}