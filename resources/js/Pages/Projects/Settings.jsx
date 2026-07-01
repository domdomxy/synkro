import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, useForm, router } from '@inertiajs/react';
import BackButton from '@/Components/BackButton';

export default function Settings({ project, role }) {
    const isOwner = role === 'owner';

    const editForm = useForm({ name: project.name, description: project.description ?? '' });
    const transferForm = useForm({ user_id: '' });

    const submitEdit = (e) => {
        e.preventDefault();
        if (!confirm('Save changes to this project?')) return;
        editForm.patch(route('projects.update', project.id));
    };

    const submitTransfer = (e) => {
        e.preventDefault();
        const member = project.members.find((m) => m.id === Number(transferForm.data.user_id));
        if (!confirm(`Transfer ownership of "${project.name}" to ${member?.name}? You will become a manager.`)) return;
        transferForm.patch(route('projects.transfer-ownership', project.id));
    };

    const deleteProject = () => {
        if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
            router.delete(route('projects.destroy', project.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Project Settings</h2>}>
            
            <Head title={`Settings - ${project.name}`} />
            <div className="py-12">
                <div className="mb-4">
                    <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                </div>
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">
                    <Link href={route('projects.logs', project.id)} className="inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                        View Activity Logs →
                    </Link>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-semibold dark:text-gray-100">Edit Project</h3>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Project Name" />
                                <TextInput id="name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={editForm.errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="description" value="Description" />
                                <textarea id="description" value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" rows={4} />
                                <InputError message={editForm.errors.description} className="mt-2" />
                            </div>
                            <PrimaryButton disabled={editForm.processing}>Save Changes</PrimaryButton>
                        </form>
                    </div>

                    {isOwner && (
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-semibold dark:text-gray-100">Transfer Ownership</h3>
                            <form onSubmit={submitTransfer} className="space-y-3">
                                <select
                                    value={transferForm.data.user_id}
                                    onChange={(e) => transferForm.setData('user_id', e.target.value)}
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                >
                                    <option value="">Choose a member...</option>
                                    {project.members.filter((m) => m.id !== project.owner_id).map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                                <InputError message={transferForm.errors.user_id} />
                                <SecondaryButton type="submit" disabled={!transferForm.data.user_id || transferForm.processing}>
                                    Transfer
                                </SecondaryButton>
                            </form>
                        </div>
                    )}

                    {isOwner && (
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h3 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Deleting a project cannot be undone.</p>
                            <DangerButton onClick={deleteProject}>Delete Project</DangerButton>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}