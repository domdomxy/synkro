import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Spinner from '@/Components/Spinner';
import BackButton from '@/Components/BackButton';
import Avatar from '@/Components/Avatar';
import FilterSelect from '@/Components/FilterSelect';
import ProjectMenu from '@/Components/ProjectMenu';
import ProjectInfoModal from '@/Components/ProjectInfoModal';
import { roleStyles } from '@/utils/roleStyles';
import { Head, Link, useForm, router } from '@inertiajs/react';
import useConfirm from '@/hooks/useConfirm';
import RichTextEditor from '@/Components/RichTextEditor';
import AdminConfirmationModal from '@/Components/AdminConfirmationModal';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useState } from 'react';

// Must match Project::DELETION_EMAIL_COOLDOWN_SECONDS on the backend - this only
// drives the countdown display, the backend is what actually enforces it.
const DELETION_EMAIL_COOLDOWN_SECONDS = 20;

function secondsUntilResendAvailable(sentAt) {
    if (!sentAt) return 0;
    const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(DELETION_EMAIL_COOLDOWN_SECONDS - elapsed));
}

function SectionCard({ icon, title, description, children, danger }) {
    return (
        <div className={`rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6 ${danger ? 'border border-red-200 dark:border-red-900/50' : ''}`}>
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
    const canManage = ['owner', 'manager'].includes(role);
    const [showInfoModal, setShowInfoModal] = useState(false);
    // A trashed project (soft-deleted, still inside its grace period) is frozen -
    // same read-only rule as Projects/Show.jsx's `isTrashed`, and backed by the
    // same trashed() checks in ProjectPolicy/ProjectController on the server, so
    // hiding these forms here is UX, not the actual enforcement.
    const isTrashed = !!project.deleted_at;

    const editForm = useForm({ name: project.name, description: project.description ?? '' });
    const transferForm = useForm({ user_id: '' });
    const { confirm, ConfirmDialog } = useConfirm();
    const [transferTarget, setTransferTarget] = useState(null);

    const hasUnsavedChanges =
        editForm.data.name !== project.name ||
        editForm.data.description !== (project.description ?? '');

    const submitEdit = async (e) => {
        e.preventDefault();
        if (!(await confirm('Save changes to this project?', { title: 'Save Changes?' }))) return;
        editForm.patch(route('projects.update', project.id));
    };

    const submitTransfer = async (e) => {
        e.preventDefault();
        const member = project.members.find((m) => m.id === Number(transferForm.data.user_id));
        if (!(await confirm(`Transfer ownership of "${project.name}" to ${member?.name}? You will become a manager.`, { title: 'Transfer Ownership?' }))) return;
        setTransferTarget(member);
    };

    const verifyAndTransfer = (code) =>
        new Promise((resolve, reject) => {
            if (!transferTarget) return reject();

            router.patch(route('projects.transfer-ownership', project.id), { user_id: transferTarget.id, confirmation_code: code }, {
                preserveScroll: true,
                onSuccess: () => { setTransferTarget(null); resolve(); },
                onError: (errors) => reject(errors.confirmation_code || errors.error || ''),
            });
        });

    const deleteProject = async () => {
        if (await confirm(`A confirmation link will be emailed to you. Once you click it, "${project.name}" moves to trash, where you can still restore it before it is permanently deleted.`, { title: 'Request Deletion?', danger: true, confirmLabel: 'Send Confirmation Email' })) {
            router.delete(route('projects.destroy', project.id));
        }
    };

    const cancelDeletion = async () => {
        if (await confirm(`Cancel the pending deletion of "${project.name}"? It will stay exactly as it is.`, { title: 'Cancel Deletion Request?' })) {
            router.post(route('projects.deletion.cancel', project.id));
        }
    };

    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(secondsUntilResendAvailable(project.deletion_email_sent_at));

    useEffect(() => {
        setCooldown(secondsUntilResendAvailable(project.deletion_email_sent_at));
    }, [project.deletion_email_sent_at]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, [cooldown > 0]);

    const resendDeletionEmail = () => {
        setResending(true);
        router.post(route('projects.deletion.resend', project.id), {}, {
            preserveScroll: true,
            onFinish: () => setResending(false),
        });
    };

    // Keeps the pending-deletion banner (and any other member's Settings tab) in sync
    // in real time, whether the request was just sent or just cancelled.
    useEcho(`project.${project.id}`, ['.project.deletion_requested', '.project.deletion_cancelled'], () => {
        router.reload({ only: ['project'] });
    });

    const transferTargets = project.members.filter((m) => m.id !== project.owner_id);
    const selectedMember = transferTargets.find((m) => m.id === Number(transferForm.data.user_id));

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                    <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                    <h2 className="min-w-0 truncate text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {project.name} Settings
                    </h2>
                </div>
                <ProjectMenu
                    project={project}
                    page="settings"
                    isOwner={isOwner}
                    canManage={canManage}
                    onShowInfo={() => setShowInfoModal(true)}
                />
            </div>
        }>
            <Head title={`Settings - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">

                    {isTrashed && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                            This project is in the trash. Settings are read-only until it's restored from the Trash page.
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Link
                            href={route('projects.logs', project.id)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            View Activity Logs
                        </Link>
                    </div>

                    <SectionCard
                        title="Edit Project"
                        description="Update the name and description shown across the app."
                        icon={
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        }
                    >
                        <form
                            onSubmit={submitEdit}
                            className={`space-y-4 ${isTrashed ? 'pointer-events-none opacity-60' : ''}`}
                        >
                            <div>
                                <InputLabel htmlFor="name" value="Project Name" />
                                <TextInput id="name" disabled={isTrashed} value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="mt-1 block w-full disabled:cursor-not-allowed" />
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
                            {!isTrashed && (
                                <div className="flex items-center gap-3">
                                    <PrimaryButton disabled={editForm.processing || !hasUnsavedChanges}>
                                        {editForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </PrimaryButton>
                                    {hasUnsavedChanges && (
                                        <span className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</span>
                                    )}
                                </div>
                            )}
                        </form>
                    </SectionCard>

                    {isOwner && !isTrashed && (
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
                                    <FilterSelect
                                        value={transferForm.data.user_id}
                                        onChange={(v) => transferForm.setData('user_id', v)}
                                        options={[
                                            { value: '', label: 'Choose a member...' },
                                            ...transferTargets.map((m) => ({
                                                value: m.id,
                                                label: m.name,
                                                avatar: m,
                                                badge: {
                                                    label: m.pivot.role,
                                                    className: roleStyles[m.pivot.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                                                },
                                            })),
                                        ]}
                                    />
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
                                        {transferForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                        Transfer
                                    </SecondaryButton>
                                </form>
                            )}
                        </SectionCard>
                    )}

                    {isOwner && !isTrashed && (
                        <SectionCard
                            title="Danger Zone"
                            description="Deleting a project moves it to trash, where it can still be restored for a few days before it is permanently deleted."
                            danger
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                        >
                            {project.deletion_requested_at ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        Deletion requested - check your email for the confirmation link. Nothing has been deleted yet.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <SecondaryButton onClick={cancelDeletion}>Cancel Deletion Request</SecondaryButton>
                                        <SecondaryButton onClick={resendDeletionEmail} disabled={resending || cooldown > 0}>
                                            {resending && <Spinner className="mr-2 h-4 w-4" />}
                                            {cooldown > 0 ? `Resend Confirmation Email (${cooldown}s)` : 'Resend Confirmation Email'}
                                        </SecondaryButton>
                                    </div>
                                </div>
                            ) : (
                                <DangerButton onClick={deleteProject}>Delete Project</DangerButton>
                            )}
                        </SectionCard>
                    )}
                </div>
            </div>
            {ConfirmDialog}
            <AdminConfirmationModal
                show={transferTarget !== null}
                purpose="projects.transfer_ownership"
                sendCodeUrl={route('projects.send-transfer-confirmation-code', project.id)}
                title="Confirm Ownership Transfer"
                description={`This will immediately hand "${project.name}" over to ${transferTarget?.name}. You'll become a manager.`}
                confirmLabel="Transfer"
                danger={false}
                onVerify={verifyAndTransfer}
                onClose={() => setTransferTarget(null)}
            />
            <ProjectInfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} project={project} />
        </AuthenticatedLayout>
    );
}