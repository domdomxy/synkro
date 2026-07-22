import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import CategoryIcon, { ICON_OPTIONS } from '@/Components/CategoryIcon';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function IconPicker({ value, onChange }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map((opt) => (
                <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    onClick={() => onChange(opt.key)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                        value === opt.key
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    <CategoryIcon icon={opt.key} className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}

function CategoryRow({ category }) {
    const [editing, setEditing] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const form = useForm({ label: category.label, icon: category.icon });

    const save = (e) => {
        e.preventDefault();
        form.patch(route('admin.feedback-categories.update', category.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const remove = () => {
        setDeleteError(null);
        if (!confirm(`Delete category "${category.label}"?`)) return;
        form.delete(route('admin.feedback-categories.destroy', category.id), {
            preserveScroll: true,
            onError: (errors) => setDeleteError(errors.category ?? null),
        });
    };

    if (editing) {
        return (
            <form onSubmit={save} className="space-y-2 rounded-md border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-950/20">
                <input
                    type="text"
                    value={form.data.label}
                    onChange={(e) => form.setData('label', e.target.value)}
                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    placeholder="Category name"
                    autoFocus
                />
                <InputError message={form.errors.label} />
                <IconPicker value={form.data.icon} onChange={(icon) => form.setData('icon', icon)} />
                <div className="flex justify-end gap-2 pt-1">
                    <SecondaryButton type="button" onClick={() => { setEditing(false); form.reset(); }}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={form.processing || !form.data.label.trim()}>Save</PrimaryButton>
                </div>
            </form>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    <CategoryIcon icon={category.icon} className="h-4 w-4" />
                </span>
                {category.label}
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label="Edit"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button
                    type="button"
                    onClick={remove}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    aria-label="Delete"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            {deleteError && <p className="absolute mt-8 text-xs text-red-500">{deleteError}</p>}
        </div>
    );
}

export default function ManageCategoriesModal({ show, onClose, categories }) {
    const { errors: pageErrors } = usePage().props;
    const addForm = useForm({ label: '', icon: 'dot' });

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('admin.feedback-categories.store'), {
            preserveScroll: true,
            onSuccess: () => addForm.reset(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Manage Feedback Categories</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    These appear as options on the public feedback form. Deleting a category is only allowed once no tickets use it.
                </p>

                {pageErrors?.category && (
                    <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        {pageErrors.category}
                    </p>
                )}

                <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {categories.length === 0 ? (
                        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">No categories yet.</p>
                    ) : (
                        categories.map((c) => <CategoryRow key={c.id} category={c} />)
                    )}
                </div>

                <form onSubmit={submitAdd} className="mt-4 space-y-2 rounded-md border border-dashed border-gray-300 p-3 dark:border-gray-600">
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Add category</label>
                    <input
                        type="text"
                        value={addForm.data.label}
                        onChange={(e) => addForm.setData('label', e.target.value)}
                        placeholder="e.g. Billing Question"
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <InputError message={addForm.errors.label} />
                    <IconPicker value={addForm.data.icon} onChange={(icon) => addForm.setData('icon', icon)} />
                    <div className="flex justify-end pt-1">
                        <PrimaryButton disabled={addForm.processing || !addForm.data.label.trim()}>Add Category</PrimaryButton>
                    </div>
                </form>

                <div className="mt-5 flex justify-end">
                    <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
