import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import BackButton from '@/Components/BackButton';
import Avatar from '@/Components/Avatar';
import { Head, Link, useForm, router } from '@inertiajs/react';
import RichTextEditor from '@/Components/RichTextEditor';

function SectionCard({ icon, title, description, children, danger }) {
    return (
        <div className={`rounded-lg bg-white p-6 shadow dark:bg-gray-800 ${danger ? 'border border-red-200 dark:border-red-900/50' : ''}`}>
            <div className="mb-4 flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    danger
                        ? 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                }`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-semibold ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {title}
                    </h3>
                    {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function Settings({ project, role }) {
    const isOwner = role === 'owner';

    const editForm = useForm({ name: project.name, description: project.description ?? '' });
    const transferForm = useForm({ user_id: '' });

    const hasUnsavedChanges =
        editForm.data.name !== project.name ||
        editForm.data.description !== (project.description ?? '');

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

    const transferTargets = project.members.filter((m) => m.id !== project.owner_id);
    const selectedMember = transferTargets.find((m) => m.id === Number(transferForm.data.user_id));

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {project.name} — Settings
                </h2>
            </div>
        }>
            <Head title={`Settings - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-6 sm:px-6 lg:px-8">

                    <Link
                        href={route('projects.logs', project.id)}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        View Activity Logs
                    </Link>

                    <SectionCard
                        title="Edit Project"
                        description="Update the name and description shown across the app."
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                    >
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Project Name" />
                                <TextInput id="name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={editForm.errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="create-description" value="Description" />
                                <RichTextEditor
                                    value={editForm.data.description}
                                    onChange={(html) => editForm.setData('description', html)}
                                />
                                <InputError message={editForm.errors.description} className="mt-2" />
                            </div>
                            <div className="flex items-center gap-3">
                                <PrimaryButton disabled={editForm.processing || !hasUnsavedChanges}>Save Changes</PrimaryButton>
                                {hasUnsavedChanges && (
                                    <span className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</span>
                                )}
                            </div>
                        </form>
                    </SectionCard>

                    {isOwner && (
                        <SectionCard
                            title="Transfer Ownership"
                            description="Hand this project over to another member. You'll become a manager."
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            }
                        >
                            {transferTargets.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">No other members to transfer ownership to yet.</p>
                            ) : (
                                <form onSubmit={submitTransfer} className="space-y-3">
                                    <select
                                        value={transferForm.data.user_id}
                                        onChange={(e) => transferForm.setData('user_id', e.target.value)}
                                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    >
                                        <option value="">Choose a member...</option>
                                        {transferTargets.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={transferForm.errors.user_id} />

                                    {selectedMember && (
                                        <div className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50">
                                            <Avatar user={selectedMember} size="h-7 w-7" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{selectedMember.name}</p>
                                                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{selectedMember.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    <SecondaryButton type="submit" disabled={!transferForm.data.user_id || transferForm.processing}>
                                        Transfer
                                    </SecondaryButton>
                                </form>
                            )}
                        </SectionCard>
                    )}

                    {isOwner && (
                        <SectionCard
                            title="Danger Zone"
                            description="Deleting a project is permanent and cannot be undone."
                            danger
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                        >
                            <DangerButton onClick={deleteProject}>Delete Project</DangerButton>
                        </SectionCard>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}