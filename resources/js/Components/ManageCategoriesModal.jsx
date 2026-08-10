import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import InputError from '@/Components/InputError';
import CategoryIcon, { ICON_OPTIONS } from '@/Components/CategoryIcon';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import useConfirm from '@/hooks/useConfirm';

// Each icon gets its own accent so the list and picker are scannable at a glance
// instead of every row wearing the same neutral chip. Purely visual - keys mirror
// CategoryIcon's ICON_OPTIONS and mean nothing to the backend.
const ICON_ACCENTS = {
    bug: { chip: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400', pick: 'border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300' },
    help: { chip: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400', pick: 'border-sky-400 bg-sky-50 text-sky-600 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-300' },
    flag: { chip: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', pick: 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300' },
    question: { chip: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400', pick: 'border-cyan-400 bg-cyan-50 text-cyan-600 dark:border-cyan-500 dark:bg-cyan-950/40 dark:text-cyan-300' },
    lightbulb: { chip: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400', pick: 'border-yellow-400 bg-yellow-50 text-yellow-600 dark:border-yellow-500 dark:bg-yellow-950/40 dark:text-yellow-300' },
    star: { chip: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-400', pick: 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-600 dark:border-fuchsia-500 dark:bg-fuchsia-950/40 dark:text-fuchsia-300' },
    chat: { chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400', pick: 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300' },
    mail: { chip: 'bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400', pick: 'border-teal-400 bg-teal-50 text-teal-600 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-300' },
    alert: { chip: 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400', pick: 'border-orange-400 bg-orange-50 text-orange-600 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-300' },
    lock: { chip: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400', pick: 'border-violet-400 bg-violet-50 text-violet-600 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-300' },
    users: { chip: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400', pick: 'border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' },
    dot: { chip: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300', pick: 'border-gray-400 bg-gray-100 text-gray-600 dark:border-gray-400 dark:bg-gray-700 dark:text-gray-200' },
};

function accentFor(icon) {
    return ICON_ACCENTS[icon] ?? ICON_ACCENTS.dot;
}

function IconPicker({ value, onChange }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map((opt) => {
                const selected = value === opt.key;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        title={opt.label}
                        onClick={() => onChange(opt.key)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                            selected
                                ? accentFor(opt.key).pick
                                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-700'
                        }`}
                    >
                        <CategoryIcon icon={opt.key} className="h-4 w-4" />
                    </button>
                );
            })}
        </div>
    );
}

function CategoryRow({ category, confirm }) {
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

    const remove = async () => {
        setDeleteError(null);
        if (!(await confirm(`Delete category "${category.label}"?`, { title: 'Delete Category?', danger: true, confirmLabel: 'Delete' }))) return;
        form.delete(route('admin.feedback-categories.destroy', category.id), {
            preserveScroll: true,
            onError: (errors) => setDeleteError(errors.category ?? null),
        });
    };

    if (editing) {
        return (
            <form onSubmit={save} className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-800 dark:bg-indigo-950/20">
                <input
                    type="text"
                    value={form.data.label}
                    onChange={(e) => form.setData('label', e.target.value)}
                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    placeholder="Category name"
                    autoFocus
                />
                <InputError message={form.errors.label} />
                <IconPicker value={form.data.icon} onChange={(icon) => form.setData('icon', icon)} />
                <div className="flex justify-end gap-2 pt-1">
                    <SecondaryButton type="button" onClick={() => { setEditing(false); form.reset(); }}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={form.processing || !form.data.label.trim()}>
                        {form.processing && <Spinner className="mr-2 h-4 w-4" />}
                        Save
                    </PrimaryButton>
                </div>
            </form>
        );
    }

    return (
        <div className="group rounded-lg border border-gray-200 p-3.5 transition hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-gray-600">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accentFor(category.icon).chip}`}>
                        <CategoryIcon icon={category.icon} className="h-4 w-4" />
                    </span>
                    <span className="truncate font-medium">{category.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-70 transition group-hover:opacity-100">
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
            </div>
            {/* Rendered in normal flow (not absolutely positioned) so a long delete error
                pushes the next row down instead of floating over it. */}
            {deleteError && <p className="mt-2 text-xs text-red-500">{deleteError}</p>}
        </div>
    );
}

export default function ManageCategoriesModal({ show, onClose, categories }) {
    const { errors: pageErrors } = usePage().props;
    const addForm = useForm({ label: '', icon: 'dot' });
    const { confirm, ConfirmDialog } = useConfirm();

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('admin.feedback-categories.store'), {
            preserveScroll: true,
            onSuccess: () => addForm.reset(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg" overlayClassName="bg-black/55 dark:bg-black/70">
            <div className="p-6">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 3h6.586a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-6.586 6.586a2 2 0 01-2.828 0l-7-7A2 2 0 013 11V5a2 2 0 012-2z" />
                            </svg>
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Feedback Categories</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                These appear as options on the public feedback form. Deleting a category is only allowed once no tickets use it.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {pageErrors?.category && (
                    <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        {pageErrors.category}
                    </p>
                )}

                <div className="mt-4">
                    {/* Thin, arrow-free scrollbar (see app.css) - the default browser scrollbar
                        drew up/down arrow buttons that overlapped and clipped the first card.
                        Capped to a fraction of the viewport (not a fixed 20rem) so the add-category
                        form and the Close button below always stay on screen - only this list
                        scrolls, instead of the whole modal needing a second, outer scroll to reach
                        content that's already below the fold. One column on phones, two from `sm`
                        up once there's room for a second card beside the first. */}
                    <div className="thin-scrollbar max-h-[min(38vh,18rem)] space-y-2 overflow-y-auto pr-1">
                        {categories.length === 0 ? (
                            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">No categories yet.</p>
                        ) : (
                            categories.map((c) => <CategoryRow key={c.id} category={c} confirm={confirm} />)
                        )}
                    </div>
                </div>

                <form onSubmit={submitAdd} className="mt-3 space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/10">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">Add category</label>
                    <input
                        type="text"
                        value={addForm.data.label}
                        onChange={(e) => addForm.setData('label', e.target.value)}
                        placeholder="e.g. Billing Question"
                        className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                    <InputError message={addForm.errors.label} />
                    <IconPicker value={addForm.data.icon} onChange={(icon) => addForm.setData('icon', icon)} />
                    <div className="flex justify-end gap-2 pt-1">
                        <SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>
                        <PrimaryButton disabled={addForm.processing || !addForm.data.label.trim()}>
                            {addForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                            Add Category
                        </PrimaryButton>
                    </div>
                </form>
            </div>
            {ConfirmDialog}
        </Modal>
    );
}
