import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BackButton from '@/Components/BackButton';
import Modal from '@/Components/Modal';
import DeliverableViewer from '@/Components/DeliverableViewer';
import FileTypeIcon, { formatSize, getFileTypeMeta, LINK_META } from '@/Components/FileTypeIcon';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import Spinner from '@/Components/Spinner';
import ProjectMenu from '@/Components/ProjectMenu';
import ProjectInfoModal from '@/Components/ProjectInfoModal';
import useConfirm from '@/hooks/useConfirm';
import { Head, useForm, router } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Matches every other dialog's overlay in the app exactly (see ConfirmDialog,
// Show.jsx, Index.jsx, etc.) - intentionally no backdrop-blur, so this dialog
// doesn't look out of place next to the rest.
const OVERLAY_CLASS = 'bg-black/55 dark:bg-black/70';

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

function ExternalLinkIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5m0 0v5m0-5L10 14M12 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5" />
        </svg>
    );
}

function LinkTypeIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

function CloseIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function KebabIcon({ className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}

function SearchIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function BoxIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    );
}

function StorageIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3zm0 0v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
        </svg>
    );
}

function RemoveButton({ onClick, title = 'Remove' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
            <CloseIcon className="h-3.5 w-3.5" />
        </button>
    );
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function SearchInput({ value, onChange, placeholder }) {
    return (
        <div className="relative flex-1 sm:max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500">
                <SearchIcon />
            </div>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-lg border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
            />
        </div>
    );
}

/** Small pill segmented control used to filter the resource list by type. */
function FilterTabs({ value, onChange, options }) {
    return (
        <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900/60">
            {options.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    onClick={() => onChange(opt.key)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        value === opt.key
                            ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    {opt.label}
                    <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                            value === opt.key
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-gray-200/70 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                    >
                        {opt.count}
                    </span>
                </button>
            ))}
        </div>
    );
}

/** At-a-glance stat cards - each one pairs an icon with a count so the strip reads visually, not just numerically, before scanning the list itself. */
function SummaryStrip({ total, files, links, totalSize }) {
    const stats = [
        { key: 'total', label: 'Total', value: total, icon: <BoxIcon className="h-4 w-4" />, accent: 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400' },
        { key: 'files', label: 'Files', value: files, icon: <FileTypeIcon name="" className="h-4 w-4" />, accent: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
        { key: 'links', label: 'Links', value: links, icon: <LinkTypeIcon className="h-4 w-4" />, accent: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' },
        ...(totalSize ? [{ key: 'storage', label: 'Storage used', value: totalSize, icon: <StorageIcon className="h-4 w-4" />, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' }] : []),
    ];

    return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {stats.map((s) => (
                <div
                    key={s.key}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.accent}`}>
                        {s.icon}
                    </span>
                    <div className="min-w-0">
                        <p className="text-lg font-semibold leading-tight text-gray-800 dark:text-gray-100">{s.value}</p>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- Shared dialog chrome (matches ConfirmDialog's visual language) ---------- */

function DialogHeader({ title, subtitle, onClose }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">{title}</h2>
                {subtitle && <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            >
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>
    );
}

function DialogActions({ children }) {
    return <div className="mt-6 flex justify-end gap-2.5">{children}</div>;
}

function DialogCancelButton({ onClick, disabled, children = 'Cancel' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
        >
            {children}
        </button>
    );
}

function DialogSubmitButton({ disabled, loading, children }) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-800"
        >
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {children}
        </button>
    );
}

/* ---------- Shared field styling, used instead of the plain Breeze inputs so both dialogs read as one polished unit ---------- */

function FieldLabel({ children }) {
    return <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{children}</label>;
}

function FieldError({ message }) {
    return message ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{message}</p> : null;
}

const fieldClass = 'mt-1.5 block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500';

function FieldInput(props) {
    return <input {...props} className={`${fieldClass} ${props.className ?? ''}`} />;
}

function FieldTextarea(props) {
    return <textarea {...props} className={`${fieldClass} resize-none ${props.className ?? ''}`} />;
}

/**
 * Batch add dialog: any mix of uploaded files and pasted links can be queued
 * up - each with its own optional description - and submitted together in
 * one request, matching the "Browse Files" + "Paste a link" flow used for
 * task deliverable submissions.
 */
function AddResourcesModal({ show, onClose, project }) {
    const [items, setItems] = useState([]); // { id, kind: 'file'|'link', file?, url?, title?, description }
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);
    const nextId = useRef(0);

    const resetState = () => {
        setItems([]);
        setLinkUrl('');
        setLinkTitle('');
        setErrors({});
        setProgress(null);
    };

    const close = () => {
        if (processing) return;
        resetState();
        onClose();
    };

    const addFiles = (e) => {
        const newItems = Array.from(e.target.files).map((file) => ({ id: ++nextId.current, kind: 'file', file, description: '' }));
        setItems((prev) => [...prev, ...newItems]);
        e.target.value = '';
    };

    const addLink = () => {
        if (!linkUrl.trim()) return;
        setItems((prev) => [...prev, { id: ++nextId.current, kind: 'link', url: linkUrl.trim(), title: linkTitle.trim(), description: '' }]);
        setLinkUrl('');
        setLinkTitle('');
    };

    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
    const updateDescription = (id, description) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, description } : i)));

    const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setIsDragging(true); };
    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current = Math.max(0, dragCounter.current - 1);
        if (dragCounter.current === 0) setIsDragging(false);
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files ?? []).map((file) => ({ id: ++nextId.current, kind: 'file', file, description: '' }));
        if (dropped.length > 0) setItems((prev) => [...prev, ...dropped]);
    };

    const totalCount = items.length;

    const submit = (e) => {
        e.preventDefault();
        if (totalCount === 0 || processing) return;

        const fileItems = items.filter((i) => i.kind === 'file');
        const linkItems = items.filter((i) => i.kind === 'link');

        router.post(route('projects.resources.store', project.id), {
            files: fileItems.map((i) => i.file),
            file_descriptions: fileItems.map((i) => i.description),
            links: linkItems.map((i) => ({ url: i.url, title: i.title, description: i.description })),
        }, {
            forceFormData: true,
            onStart: () => setProcessing(true),
            onProgress: (p) => setProgress(p),
            onSuccess: () => { resetState(); onClose(); },
            onError: (errs) => setErrors(errs),
            onFinish: () => { setProcessing(false); setProgress(null); },
        });
    };

    return (
        <Modal show={show} onClose={close} maxWidth="lg" overlayClassName={OVERLAY_CLASS}>
            <form onSubmit={submit} className="p-6">
                <DialogHeader
                    title="Add Resources"
                    subtitle="Add any mix of files (up to 50MB each) and links, each with an optional description. Members will be able to view and download them."
                    onClose={close}
                />

                <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-4 rounded-lg border-2 border-dashed p-3 transition ${
                        isDragging
                            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30'
                            : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40'
                    }`}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <input ref={fileInputRef} type="file" multiple onChange={addFiles} className="hidden" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm transition hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            <UploadIcon className="h-3.5 w-3.5" />
                            Browse Files
                        </button>
                        <div className="flex min-w-[260px] flex-1 items-center gap-1 rounded-md bg-white pl-2.5 pr-1 shadow-sm dark:bg-neutral-800">
                            <input
                                type="text"
                                value={linkTitle}
                                onChange={(e) => setLinkTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                placeholder="Title (optional)"
                                className="w-28 shrink-0 border-0 border-r border-neutral-100 bg-transparent p-0 py-1.5 pr-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:ring-0 dark:border-neutral-700 dark:text-neutral-300"
                            />
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                                placeholder="Paste a link..."
                                className="flex-1 border-0 bg-transparent p-0 py-1.5 pl-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:ring-0 dark:text-neutral-300"
                            />
                            <button
                                type="button"
                                onClick={addLink}
                                className="shrink-0 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                            >
                                Add
                            </button>
                        </div>
                        <p className="w-full text-[11px] text-neutral-400 dark:text-neutral-500">or drag and drop files anywhere in this box</p>
                    </div>

                    {totalCount > 0 && (
                        <ul className="mt-2.5 max-h-72 space-y-2 overflow-y-auto">
                            {items.map((item) => (
                                <li key={item.id} className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-800">
                                    <div className="flex items-center gap-2">
                                        {item.kind === 'file' ? (
                                            <FileTypeIcon name={item.file.name} className="h-4 w-4 shrink-0 text-neutral-400" />
                                        ) : (
                                            <LinkTypeIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-neutral-700 dark:text-neutral-300">
                                                {item.kind === 'file' ? item.file.name : (item.title || item.url)}
                                            </p>
                                            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                                                {item.kind === 'file' ? formatSize(item.file.size) : item.url}
                                            </p>
                                        </div>
                                        <RemoveButton onClick={() => removeItem(item.id)} />
                                    </div>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateDescription(item.id, e.target.value)}
                                        placeholder="Add a description (optional)"
                                        className="mt-2 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:placeholder:text-neutral-500"
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <FieldError message={errors.files} />
                <FieldError message={errors.links} />

                {progress && (
                    <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Uploading... {progress.percentage}%</p>
                    </div>
                )}

                <DialogActions>
                    <DialogCancelButton onClick={close} disabled={processing} />
                    <DialogSubmitButton disabled={processing || totalCount === 0} loading={processing}>
                        {processing
                            ? 'Adding...'
                            : totalCount > 0
                                ? `Add ${totalCount} Resource${totalCount > 1 ? 's' : ''}`
                                : 'Add Resources'}
                    </DialogSubmitButton>
                </DialogActions>
            </form>
        </Modal>
    );
}

/** Edits a single resource - name/description always, plus either a file replacement or a URL depending on type. */
function EditResourceModal({ resource, onClose }) {
    const isLink = resource?.type === 'link';
    const fileInputRef = useRef(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const fileDragCounter = useRef(0);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: resource?.name ?? '',
        description: resource?.description ?? '',
        url: resource?.url ?? '',
        file: null,
    });

    // Re-seed the form whenever a different resource is opened for editing.
    useEffect(() => {
        if (resource) {
            setData({
                name: resource.name ?? '',
                description: resource.description ?? '',
                url: resource.url ?? '',
                file: null,
            });
            clearErrors();
            setIsDraggingFile(false);
            fileDragCounter.current = 0;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resource?.id]);

    const handleFileDragEnter = (e) => {
        e.preventDefault();
        fileDragCounter.current++;
        setIsDraggingFile(true);
    };

    const handleFileDragLeave = (e) => {
        e.preventDefault();
        fileDragCounter.current = Math.max(0, fileDragCounter.current - 1);
        if (fileDragCounter.current === 0) setIsDraggingFile(false);
    };

    const handleFileDragOver = (e) => e.preventDefault();

    const handleFileDrop = (e) => {
        e.preventDefault();
        fileDragCounter.current = 0;
        setIsDraggingFile(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setData('file', dropped);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.resources.update', resource.id), {
            forceFormData: true,
            onSuccess: close,
        });
    };

    const close = () => {
        reset();
        onClose();
    };

    if (!resource) return null;

    return (
        <Modal show={!!resource} onClose={close} maxWidth="md" overlayClassName={OVERLAY_CLASS}>
            <form onSubmit={submit} className="p-6">
                <DialogHeader title={isLink ? 'Edit Link' : 'Edit File'} onClose={close} />

                <div className="mt-5">
                    <FieldLabel>Name</FieldLabel>
                    <FieldInput
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <FieldError message={errors.name} />
                </div>

                {isLink ? (
                    <div className="mt-4">
                        <FieldLabel>URL</FieldLabel>
                        <FieldInput
                            type="url"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                        />
                        <FieldError message={errors.url} />
                    </div>
                ) : (
                    <div className="mt-4">
                        <FieldLabel>File</FieldLabel>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => setData('file', e.target.files[0] ?? null)}
                            className="hidden"
                        />
                        <div
                            onDragEnter={handleFileDragEnter}
                            onDragOver={handleFileDragOver}
                            onDragLeave={handleFileDragLeave}
                            onDrop={handleFileDrop}
                            className={`mt-1.5 rounded-lg border-2 border-dashed p-2 transition ${
                                isDraggingFile
                                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30'
                                    : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40'
                            }`}
                        >
                            {data.file ? (
                                <div className="flex items-center gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-900 dark:bg-indigo-950/30">
                                    <FileTypeIcon name={data.file.name} className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-indigo-700 dark:text-indigo-300">{data.file.name}</p>
                                        <p className="text-xs text-indigo-400 dark:text-indigo-400/80">{formatSize(data.file.size)} &middot; will replace the current file</p>
                                    </div>
                                    <RemoveButton onClick={() => setData('file', null)} title="Keep current file" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
                                    <FileTypeIcon name={resource.original_name} className="h-4 w-4 shrink-0 text-neutral-400" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm text-neutral-700 dark:text-neutral-300">{resource.original_name}</p>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatSize(resource.size)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                                    >
                                        Replace
                                    </button>
                                </div>
                            )}
                            <p className="mt-1.5 px-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                                {isDraggingFile ? 'Drop to replace' : 'or drag and drop a file anywhere here'}
                            </p>
                        </div>
                        <FieldError message={errors.file} />
                    </div>
                )}

                <div className="mt-4">
                    <FieldLabel>Description (optional)</FieldLabel>
                    <FieldTextarea
                        rows={3}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="What is this for, and how should members use it?"
                    />
                    <FieldError message={errors.description} />
                </div>

                <DialogActions>
                    <DialogCancelButton onClick={close} disabled={processing} />
                    <DialogSubmitButton disabled={processing} loading={processing}>{processing ? 'Saving...' : 'Save Changes'}</DialogSubmitButton>
                </DialogActions>
            </form>
        </Modal>
    );
}

/** Owner/manager-only actions (edit, delete) tucked behind a kebab menu; download/open stays visible to everyone. */
function ResourceMenu({ onEdit, onDelete }) {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const ref = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    // Flip the menu to open upward instead of downward when there isn't
    // enough room below the button (e.g. the last resource in a long list,
    // near the bottom of the viewport).
    useLayoutEffect(() => {
        if (!open || !ref.current || !menuRef.current) return;
        const buttonRect = ref.current.getBoundingClientRect();
        const menuHeight = menuRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        setOpenUpward(spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                title="More actions"
                className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                <KebabIcon className="h-4 w-4" />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className={`absolute right-0 z-20 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700 ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                >
                    <button
                        type="button"
                        onClick={() => { setOpen(false); onEdit(); }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => { setOpen(false); onDelete(); }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Each resource is its own card now (rather than a divided table row) with a
 * left accent stripe and a color-coded icon badge, both driven by the same
 * file-type metadata, so the type of a resource reads at a glance before you
 * ever read its name.
 */
function ResourceRow({ resource, canManage, onPreview, onEdit, onDelete }) {
    const isLink = resource.type === 'link';
    const meta = isLink ? LINK_META : getFileTypeMeta(resource.original_name);

    return (
        <div
            className={`group flex items-start gap-3 rounded-xl border border-l-[3px] border-gray-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${meta.border}`}
        >
            <button
                type="button"
                onClick={() => onPreview(resource)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${meta.badge}`}
                title="Preview"
            >
                {isLink ? <LinkTypeIcon className="h-5 w-5" /> : <FileTypeIcon name={resource.original_name} className="h-5 w-5" />}
            </button>

            <button type="button" onClick={() => onPreview(resource)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200">{resource.name}</p>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${meta.badge}`}>
                        {meta.label}
                    </span>
                </div>
                {resource.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{resource.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {resource.uploader?.name ?? 'Unknown'} &middot; {formatDate(resource.created_at)}
                    {!isLink && formatSize(resource.size) && <> &middot; {formatSize(resource.size)}</>}
                </p>
            </button>

            <div className="flex shrink-0 items-center gap-1">
                {isLink ? (
                    <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open link"
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                    >
                        <ExternalLinkIcon />
                    </a>
                ) : (
                    <a
                        href={`/storage/${resource.path}`}
                        download={resource.original_name}
                        title="Download"
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                    >
                        <DownloadIcon />
                    </a>
                )}
                {canManage && (
                    <ResourceMenu onEdit={() => onEdit(resource)} onDelete={() => onDelete(resource)} />
                )}
            </div>
        </div>
    );
}

export default function Resources({ project, resources, canManage, role }) {
    const isOwner = role === 'owner';
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [previewingResource, setPreviewingResource] = useState(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'file' | 'link'
    const { confirm, ConfirmDialog } = useConfirm();
    const toolbarRef = useRef(null);

    const deleteResource = async (resource) => {
        if (await confirm(`"${resource.name}" will be permanently removed for everyone.`, {
            title: resource.type === 'link' ? 'Delete Link?' : 'Delete File?',
            danger: true,
            confirmLabel: 'Delete',
        })) {
            router.delete(route('projects.resources.destroy', resource.id));
        }
    };

    const previewDeliverable = previewingResource
        ? (previewingResource.type === 'link'
            ? { type: 'link', url: previewingResource.url, title: previewingResource.name }
            : { type: 'file', path: previewingResource.path, original_name: previewingResource.original_name })
        : null;

    const fileCount = resources.filter((r) => r.type !== 'link').length;
    const linkCount = resources.filter((r) => r.type === 'link').length;
    const totalBytes = resources.reduce((sum, r) => sum + (r.type !== 'link' ? (r.size ?? 0) : 0), 0);

    const filterOptions = [
        { key: 'all', label: 'All', count: resources.length },
        { key: 'file', label: 'Files', count: fileCount },
        { key: 'link', label: 'Links', count: linkCount },
    ];

    const query = search.trim().toLowerCase();
    const visibleResources = resources.filter((r) => {
        if (typeFilter === 'file' && r.type === 'link') return false;
        if (typeFilter === 'link' && r.type !== 'link') return false;
        if (!query) return true;
        return r.name.toLowerCase().includes(query) || (r.description ?? '').toLowerCase().includes(query);
    });

    const isFiltering = query.length > 0 || typeFilter !== 'all';

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                    <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                    <h2 className="min-w-0 truncate text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Resources: {project.name}
                    </h2>
                </div>
                <ProjectMenu
                    project={project}
                    page="resources"
                    isOwner={isOwner}
                    canManage={canManage}
                    onShowInfo={() => setShowInfoModal(true)}
                />
            </div>
        }>
            <Head title={`Resources - ${project.name}`} />
            <div className="py-12">
                <div className="mx-auto max-w-8xl space-y-5 px-4 sm:px-6 lg:px-8">

                    <div ref={toolbarRef} className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                Packages, sources, and references shared by the project's owner and managers
                            </p>
                        </div>
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setShowAdd(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                            >
                                <UploadIcon className="h-4 w-4" />
                                Add Resources
                            </button>
                        )}
                    </div>

                    {resources.length > 0 && <SummaryStrip total={resources.length} files={fileCount} links={linkCount} totalSize={formatSize(totalBytes)} />}

                    {resources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2.5">
                            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..." />
                            <FilterTabs value={typeFilter} onChange={setTypeFilter} options={filterOptions} />
                        </div>
                    )}

                    {resources.length === 0 ? (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800/60">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-400">
                                <BoxIcon className="h-7 w-7" />
                            </div>
                            <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                                {canManage
                                    ? 'No resources yet. Add a package, source, or reference for members to use.'
                                    : "No resources here yet. The project's owner or managers can add some."}
                            </p>
                        </div>
                    ) : visibleResources.length === 0 ? (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-800/60">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300 dark:bg-gray-900 dark:text-gray-600">
                                <SearchIcon className="h-5 w-5" />
                            </div>
                            <p className="text-sm text-gray-400 dark:text-gray-500">No resources match your search.</p>
                            <button
                                type="button"
                                onClick={() => { setSearch(''); setTypeFilter('all'); }}
                                className="mt-2 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {visibleResources.map((resource) => (
                                <ResourceRow
                                    key={resource.id}
                                    resource={resource}
                                    canManage={canManage}
                                    onPreview={setPreviewingResource}
                                    onEdit={setEditingResource}
                                    onDelete={deleteResource}
                                />
                            ))}
                        </div>
                    )}
                    {isFiltering && visibleResources.length > 0 && (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                            Showing {visibleResources.length} of {resources.length} resources
                        </p>
                    )}
                </div>
            </div>

            {canManage && <AddResourcesModal show={showAdd} onClose={() => setShowAdd(false)} project={project} />}
            {canManage && <EditResourceModal resource={editingResource} onClose={() => setEditingResource(null)} />}
            <DeliverableViewer deliverable={previewDeliverable} onClose={() => setPreviewingResource(null)} />
            {ConfirmDialog}

            <ScrollToPaginationButton targetRef={toolbarRef} />

            <ProjectInfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} project={project} />
        </AuthenticatedLayout>
    );
}
