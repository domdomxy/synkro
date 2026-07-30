import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import Modal from '@/Components/Modal';
import DeliverableViewer from '@/Components/DeliverableViewer';
import FileTypeIcon, { formatSize } from '@/Components/FileTypeIcon';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import useConfirm from '@/hooks/useConfirm';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

function UploadIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M17 8l-5-5-5 5M12 3v13" />
        </svg>
    );
}

function DownloadIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
    );
}

function PencilIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}

function TrashIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function UploadModal({ show, onClose, project }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.resources.store', project.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const close = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={close} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">Add a File</h2>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    Any file type is accepted (up to 50MB). Members will be able to view and download it.
                </p>

                <div className="mt-4">
                    <InputLabel htmlFor="resource-file" value="File" />
                    <input
                        id="resource-file"
                        type="file"
                        onChange={(e) => setData('file', e.target.files[0] ?? null)}
                        className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-900/40 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900/70"
                    />
                    <InputError message={errors.file} className="mt-1.5" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="resource-name" value="Name (optional)" />
                    <TextInput
                        id="resource-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder={data.file?.name ?? 'Defaults to the file name'}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="resource-description" value="Description (optional)" />
                    <textarea
                        id="resource-description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        placeholder="What is this file, and how should members use it?"
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <InputError message={errors.description} className="mt-1.5" />
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                    <SecondaryButton type="button" onClick={close}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing || !data.file}>Add File</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

function EditModal({ resource, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: resource?.name ?? '',
        description: resource?.description ?? '',
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.resources.update', resource.id), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const close = () => {
        reset();
        onClose();
    };

    if (!resource) return null;

    return (
        <Modal show={!!resource} onClose={close} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">Edit File</h2>

                <div className="mt-4">
                    <InputLabel htmlFor="edit-resource-name" value="Name" />
                    <TextInput
                        id="edit-resource-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="edit-resource-description" value="Description" />
                    <textarea
                        id="edit-resource-description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <InputError message={errors.description} className="mt-1.5" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="edit-resource-file" value="Replace file (optional)" />
                    <input
                        id="edit-resource-file"
                        type="file"
                        onChange={(e) => setData('file', e.target.files[0] ?? null)}
                        className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-100 dark:text-gray-300 dark:file:bg-indigo-900/40 dark:file:text-indigo-300 dark:hover:file:bg-indigo-900/70"
                    />
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Currently: {resource.original_name} ({formatSize(resource.size)})
                    </p>
                    <InputError message={errors.file} className="mt-1.5" />
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                    <SecondaryButton type="button" onClick={close}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}

function ResourceRow({ resource, canManage, onPreview, onEdit, onDelete }) {
    return (
        <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 last:border-0 dark:border-gray-700">
            <button
                type="button"
                onClick={() => onPreview(resource)}
                className="mt-0.5 shrink-0 rounded-md bg-gray-50 p-2 text-gray-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-gray-900 dark:text-gray-500 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300"
                title="Preview"
            >
                <FileTypeIcon name={resource.original_name} className="h-5 w-5" />
            </button>

            <button type="button" onClick={() => onPreview(resource)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{resource.name}</p>
                {resource.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{resource.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {resource.uploader?.name ?? 'Unknown'} &middot; {formatDate(resource.created_at)}
                    {formatSize(resource.size) && <> &middot; {formatSize(resource.size)}</>}
                </p>
            </button>

            <div className="flex shrink-0 items-center gap-1">
                <a
                    href={`/storage/${resource.path}`}
                    download={resource.original_name}
                    title="Download"
                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                >
                    <DownloadIcon />
                </a>
                {canManage && (
                    <>
                        <button
                            type="button"
                            onClick={() => onEdit(resource)}
                            title="Edit"
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <PencilIcon />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(resource)}
                            title="Delete"
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        >
                            <TrashIcon />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Resources({ project, resources, canManage }) {
    const [showUpload, setShowUpload] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [previewingResource, setPreviewingResource] = useState(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const deleteResource = async (resource) => {
        if (await confirm(`"${resource.name}" will be permanently removed for everyone.`, {
            title: 'Delete File?',
            danger: true,
            confirmLabel: 'Delete',
        })) {
            router.delete(route('projects.resources.destroy', resource.id));
        }
    };

    const previewDeliverable = previewingResource
        ? { type: 'file', path: previewingResource.path, original_name: previewingResource.original_name }
        : null;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-4">
                <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Resources: {project.name}
                </h2>
            </div>
        }>
            <Head title={`Resources - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            Packages, sources, and references shared by the project's owner and managers
                        </p>
                        {canManage && (
                            <PrimaryButton onClick={() => setShowUpload(true)} className="gap-1.5">
                                <UploadIcon />
                                Add File
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                        {resources.length === 0 ? (
                            <div className="px-6 py-10 text-center">
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {canManage
                                        ? 'No files yet. Add a package, source, or reference for members to use.'
                                        : "No files here yet. The project's owner or managers can add some."}
                                </p>
                            </div>
                        ) : (
                            resources.map((resource) => (
                                <ResourceRow
                                    key={resource.id}
                                    resource={resource}
                                    canManage={canManage}
                                    onPreview={setPreviewingResource}
                                    onEdit={setEditingResource}
                                    onDelete={deleteResource}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {canManage && <UploadModal show={showUpload} onClose={() => setShowUpload(false)} project={project} />}
            {canManage && <EditModal resource={editingResource} onClose={() => setEditingResource(null)} />}
            <DeliverableViewer deliverable={previewDeliverable} onClose={() => setPreviewingResource(null)} />
            {ConfirmDialog}
        </AuthenticatedLayout>
    );
}
