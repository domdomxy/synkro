import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const roleStyles = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    tester: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export default function Index({ projects }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const createForm = useForm({ name: '', description: '' });

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('projects.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        createForm.reset();
        createForm.clearErrors();
    };

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        return projects.filter((project) => {
            if (roleFilter !== 'all' && project.pivot?.role !== roleFilter) return false;
            if (!term) return true;

            return (
                project.name.toLowerCase().includes(term) ||
                project.owner?.name?.toLowerCase().includes(term) ||
                project.owner?.email?.toLowerCase().includes(term)
            );
        });
    }, [projects, search, roleFilter]);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Projects</h2>}>
            <Head title="Projects" />
            <div className="py-12">
                
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <TextInput
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by project name or owner..."
                                className="w-72"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            >
                                <option value="all">All Roles</option>
                                <option value="owner">Owner</option>
                                <option value="manager">Manager</option>
                                <option value="member">Member</option>
                                <option value="tester">Tester</option>
                            </select>
                        </div>
                        <PrimaryButton onClick={() => setShowCreateModal(true)}>New Project</PrimaryButton>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((project) => {
                            const progress = project.tasks_count > 0
                                ? Math.round((project.done_tasks_count / project.tasks_count) * 100)
                                : 0;

                            return (
                                <Link
                                    key={project.id}
                                    href={route('projects.show', project.id)}
                                    className="block rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="min-w-0 truncate text-lg font-semibold text-gray-900 dark:text-gray-100" title={project.name}>
                                            {project.name}
                                        </h3>
                                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${roleStyles[project.pivot?.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {project.pivot?.role}
                                        </span>
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                                        {project.tasks_count} tasks · owner: {project.owner?.name}
                                    </p>
                                    <div className="mt-3">
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">{progress}% done</p>
                                    </div>
                                </Link>
                            );
                        })}
                        {filtered.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400">
                                {projects.length === 0 ? "You don't have any projects yet." : 'No projects match your search.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Modal show={showCreateModal} onClose={closeCreateModal}>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">New Project</h2>
                    <div className="mt-4">
                        <InputLabel htmlFor="create-name" value="Project Name" />
                        <TextInput
                            id="create-name"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            className="mt-1 block w-full"
                            autoFocus
                        />
                        <InputError message={createForm.errors.name} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="create-description" value="Description" />
                        <textarea
                            id="create-description"
                            value={createForm.data.description}
                            onChange={(e) => createForm.setData('description', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            rows={4}
                        />
                        <InputError message={createForm.errors.description} className="mt-2" />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton onClick={closeCreateModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={createForm.processing}>Create Project</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}