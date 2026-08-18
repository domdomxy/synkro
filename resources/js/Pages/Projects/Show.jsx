import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ScrollToPaginationButton from '@/Components/ScrollToPaginationButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Spinner from '@/Components/Spinner';
import Avatar from '@/Components/Avatar';
import TaskRow from '@/Components/TaskRow';
import TaskBoard from '@/Components/TaskBoard';
import useConfirm from '@/hooks/useConfirm';
import useMuteScope from '@/hooks/useMuteScope';
import useLandscapeOnOpen from '@/hooks/useLandscapeOnOpen';
import UserSearchInput from '@/Components/UserSearchInput';
import RemoveMemberModal from '@/Components/RemoveMemberModal';
import Modal from '@/Components/Modal';
import RichTextEditor from '@/Components/RichTextEditor';
import AutoGrowTextarea from '@/Components/AutoGrowTextarea';
import FilterSelect from '@/Components/FilterSelect';
import FiltersMenu from '@/Components/FiltersMenu';
import ProjectMenu from '@/Components/ProjectMenu';
import ProjectInfoModal from '@/Components/ProjectInfoModal';
import { localDateTimeToIso } from '@/utils/datetime';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { roleStyles } from '@/utils/roleStyles';

// Must match Project::DELETION_EMAIL_COOLDOWN_SECONDS on the backend - this only
// drives the countdown display, the backend is what actually enforces it.
const DELETION_EMAIL_COOLDOWN_SECONDS = 20;

function secondsUntilResendAvailable(sentAt) {
    if (!sentAt) return 0;
    const elapsed = (Date.now() - new Date(sentAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(DELETION_EMAIL_COOLDOWN_SECONDS - elapsed));
}

const statusBarColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    submitted: 'bg-yellow-500',
    in_review: 'bg-purple-500',
    done: 'bg-green-500',
};

const statusPillStyles = {
    todo: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    in_review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
];

const PRIORITY_FILTER_OPTIONS = [
    { value: 'all', label: 'All Priorities' },
    ...PRIORITY_OPTIONS,
];

const ROLE_OPTIONS = [
    { value: 'manager', label: 'Manager' },
    { value: 'member', label: 'Member' },
    { value: 'tester', label: 'Tester' },
];

// Owner outranks everyone (there's only ever one), then manager, then tester,
// then member - matches the order role badges/permissions escalate in
// throughout the rest of the app. Any role not in this map (shouldn't
// happen) sorts last rather than crashing the comparator.
const ROLE_ORDER = { owner: 0, manager: 1, tester: 2, member: 3 };

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );
}

function SearchInput({ value, onChange, placeholder, className = '' }) {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center">
                <SearchIcon />
            </div>
            <TextInput value={value} onChange={onChange} placeholder={placeholder} className={`pl-8 ${className}`} />
        </div>
    );
}

function TaskStatusBar({ tasks }) {
    const total = tasks.length;
    if (total === 0) return null;
    const counts = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
    return (
        <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            {Object.entries(statusBarColors).map(([status, color]) => {
                const count = counts[status] ?? 0;
                if (count === 0) return null;
                return <div key={status} className={color} style={{ width: `${(count / total) * 100}%` }} title={`${status.replace('_', ' ')}: ${count}`} />;
            })}
        </div>
    );
}

function useFixedDropdown(menuWidth) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - menuWidth) });
        }
        setOpen((v) => !v);
    };

    useLayoutEffect(() => {
        if (!open || !menuRef.current || !btnRef.current) return;
        const menuRect = menuRef.current.getBoundingClientRect();
        const btnRect = btnRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - btnRect.bottom;
        if (spaceBelow < menuRect.height + 12 && btnRect.top > menuRect.height + 12) {
            setCoords((prev) => ({ ...prev, top: btnRect.top - menuRect.height - 4 }));
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false);
        };
        const handleScroll = () => setOpen(false);
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    return { open, setOpen, coords, btnRef, menuRef, toggle };
}

function MemberActionsMenu({ currentRole, onChangeRole, onRemove }) {
    const MENU_WIDTH = 176;
    const { open, setOpen, coords, btnRef, menuRef, toggle } = useFixedDropdown(MENU_WIDTH);
    const roles = ['manager', 'member', 'tester'].filter((r) => r !== currentRole);

    return (
        <>
            <button ref={btnRef} onClick={toggle} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }} className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <p className="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Change Role</p>
                    {roles.map((r) => (
                        <button key={r} onClick={() => { setOpen(false); onChangeRole(r); }} className="block w-full px-4 py-1.5 text-left text-sm capitalize text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                            {r}
                        </button>
                    ))}
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button onClick={() => { setOpen(false); onRemove(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                        Remove from project
                    </button>
                </div>
            )}
        </>
    );
}

function timeAgoLabel(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function NoteKebabMenu({ onEdit, onDelete }) {
    const MENU_WIDTH = 176;
    const { open, setOpen, coords, btnRef, menuRef, toggle } = useFixedDropdown(MENU_WIDTH);

    return (
        <>
            <button
                ref={btnRef}
                onClick={(e) => { e.stopPropagation(); toggle(); }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }} className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="block w-full px-4 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Edit</button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">Delete</button>
                </div>
            )}
        </>
    );
}

function NoteItemRow({ item, onToggle, onRemove }) {
    return (
        <li className="group/item flex items-start gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800/60 dark:ring-gray-700/60">
            <button
                type="button"
                onClick={onToggle}
                aria-pressed={item.done}
                aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    item.done
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-gray-300 bg-white hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900'
                }`}
            >
                {item.done && (
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>
            <span className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm ${item.done ? 'text-gray-400 line-through dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                {item.text}
            </span>
            {item.checklist_item_id != null && (
                <svg
                    className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400 dark:text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    title="Synced with the task checklist"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            )}
            <button
                type="button"
                onClick={onRemove}
                title="Remove item"
                className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition hover:text-red-500 group-hover/item:opacity-100 dark:text-gray-600"
            >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </li>
    );
}

function NoteEditForm({ editForm, onSubmit, onCancel }) {
    const setItemText = (index, text) => {
        const items = [...editForm.data.items];
        items[index] = { ...items[index], text };
        editForm.setData('items', items);
    };
    const addBlankItem = () => editForm.setData('items', [...editForm.data.items, { id: null, text: '' }]);
    const removeItem = (index) => editForm.setData('items', editForm.data.items.filter((_, i) => i !== index));

    return (
        <li className="rounded-2xl bg-gray-50 px-4 py-3.5 dark:bg-gray-900/70">
            <form onSubmit={onSubmit} className="space-y-2">
                <input type="text" placeholder="Title (e.g. Authentication)" value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" autoFocus />
                <div className="space-y-1.5">
                    {editForm.data.items.map((item, index) => (
                        <div key={item.id ?? `new-${index}`} className="flex items-start gap-1.5">
                            <AutoGrowTextarea
                                value={item.text}
                                onChange={(e) => setItemText(index, e.target.value)}
                                placeholder="Checklist item"
                                className="block w-full rounded-md border-gray-300 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            />
                            {editForm.data.items.length > 1 && (
                                <button type="button" onClick={() => removeItem(index)} className="mt-0.5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addBlankItem} className="text-xs font-medium text-indigo-500 hover:underline">+ Add item</button>
                <InputError message={editForm.errors.items} />
                <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={editForm.processing} className="flex flex-1 items-center justify-center rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        {editForm.processing && <Spinner className="mr-1.5 h-3.5 w-3.5" />}
                        Save
                    </button>
                    <button type="button" onClick={onCancel} className="flex-1 rounded-md bg-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
                </div>
            </form>
        </li>
    );
}

function NoteCard({ note, isEditing, editForm, onStartEdit, onSubmitEdit, onCancelEdit, onDelete, onToggleItem, onRemoveItem, onAddItem, onClearCompleted }) {
    const [quickAdd, setQuickAdd] = useState('');
    const items = note.content ?? [];
    const doneCount = items.filter((i) => i.done).length;
    const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

    if (isEditing) {
        return <NoteEditForm editForm={editForm} onSubmit={onSubmitEdit} onCancel={onCancelEdit} />;
    }

    const submitQuickAdd = (e) => {
        e.preventDefault();
        const text = quickAdd.trim();
        if (!text) return;
        onAddItem(text);
        setQuickAdd('');
    };

    return (
        <li className="rounded-2xl bg-gray-50 px-4 py-3.5 dark:bg-gray-900/70">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{note.title || 'Checklist'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                            <div className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400 dark:text-gray-500">{doneCount}/{items.length} &bull; {timeAgoLabel(note.updated_at)}</span>
                        {doneCount > 0 && (
                            <button onClick={onClearCompleted} className="shrink-0 whitespace-nowrap text-[11px] font-medium text-indigo-500 hover:underline">Clear completed</button>
                        )}
                    </div>
                </div>
                <NoteKebabMenu onEdit={onStartEdit} onDelete={onDelete} />
            </div>

            {/* border-t + pt separates the note's own header (title, progress,
                Clear completed) from its items - previously just an mt-2 gap,
                which read as one continuous block instead of two sections. */}
            <div className="mt-3 border-t border-gray-200 pt-2.5 dark:border-gray-700">
                <ul className="space-y-1.5 pl-0.5">
                    {items.map((item) => (
                        <NoteItemRow key={item.id} item={item} onToggle={() => onToggleItem(item.id)} onRemove={() => onRemoveItem(item.id)} />
                    ))}
                </ul>

                <form onSubmit={submitQuickAdd} className="mt-1.5 flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <AutoGrowTextarea
                        value={quickAdd}
                        onChange={(e) => setQuickAdd(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (quickAdd.trim()) submitQuickAdd(e);
                            }
                        }}
                        placeholder="Add item..."
                        className="block w-full border-0 border-b border-transparent bg-transparent p-0 text-xs text-gray-500 placeholder-gray-300 focus:border-indigo-400 focus:ring-0 dark:text-gray-400 dark:placeholder-gray-600"
                    />
                </form>
            </div>
        </li>
    );
}

function NotesPanel({ project, myNotes }) {
    const [editingId, setEditingId] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    const newForm = useForm({ title: '', itemsText: '' });
    const editForm = useForm({ title: '', items: [] });
    const { confirm, ConfirmDialog } = useConfirm();

    const sorted = useMemo(
        () => [...myNotes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)),
        [myNotes]
    );

    const submitNew = (e) => {
        e.preventDefault();
        newForm.transform((data) => ({
            title: data.title,
            items: data.itemsText.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l.length > 0),
        }));
        newForm.post(route('projects.notes.store', project.id), {
            onSuccess: () => { newForm.reset(); setShowNewForm(false); },
        });
    };

    const startEdit = (note) => {
        setEditingId(note.id);
        editForm.setData({
            title: note.title ?? '',
            items: (note.content ?? []).map((i) => ({ id: i.id, text: i.text })),
        });
    };

    const submitEdit = (e, noteId) => {
        e.preventDefault();
        editForm.patch(route('projects.notes.update', noteId), { onSuccess: () => setEditingId(null) });
    };

    const deleteNote = async (noteId) => { if (await confirm('This will permanently remove the checklist.', { title: 'Delete Checklist?', danger: true, confirmLabel: 'Delete' })) router.delete(route('projects.notes.destroy', noteId), { preserveScroll: true }); };

    const toggleItem = (noteId, itemId) => router.patch(route('projects.notes.items.toggle', [noteId, itemId]), {}, { preserveScroll: true });
    const removeItem = (noteId, itemId) => router.delete(route('projects.notes.items.remove', [noteId, itemId]), { preserveScroll: true });
    const addItem = (noteId, text) => router.post(route('projects.notes.items.add', noteId), { text }, { preserveScroll: true });
    const clearCompletedItems = (noteId) => router.delete(route('projects.notes.items.clear-completed', noteId), { preserveScroll: true });

    const clearAll = async () => {
        if (await confirm('This will remove all your checklists on this project. This cannot be undone.', { title: 'Clear All Checklists?', danger: true, confirmLabel: 'Clear All' })) {
            router.delete(route('projects.notes.clear', project.id));
        }
    };

    return (
        <div className="min-w-0 rounded-lg bg-white p-4 shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className={`flex flex-wrap items-center justify-between gap-2 ${collapsed ? '' : 'mb-4'}`}>
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M2 12v6a2 2 0 002 2h12" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold dark:text-gray-100">My Notes</span>
                    {sorted.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{sorted.length}</span>
                    )}
                    <svg className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <button onClick={() => { setShowNewForm((v) => !v); setCollapsed(false); }} className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500">
                    {showNewForm ? 'Cancel' : (
                        <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            New Checklist
                        </>
                    )}
                </button>
            </div>

            {!collapsed && (
                <>
            {sorted.length > 0 && !showNewForm && (
                <p className="mb-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>Visible only to you</span>
                    <button onClick={clearAll} className="font-medium text-red-500 hover:underline">Clear all</button>
                </p>
            )}

            {showNewForm && (
                <form onSubmit={submitNew} className="mb-4 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                    <input type="text" placeholder="Title (e.g. Authentication)" value={newForm.data.title} onChange={(e) => newForm.setData('title', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" autoFocus />
                    <textarea placeholder="One checklist item per line" value={newForm.data.itemsText} onChange={(e) => newForm.setData('itemsText', e.target.value)} rows={3} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                    <InputError message={newForm.errors.items} />
                    <button type="submit" disabled={newForm.processing} className="flex w-full items-center justify-center rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                        {newForm.processing && <Spinner className="mr-1.5 h-3.5 w-3.5" />}
                        Save Checklist
                    </button>
                </form>
            )}

            {sorted.length === 0 && !showNewForm ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M2 12v6a2 2 0 002 2h12" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No checklists yet</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">Jot down a to-do list private to you on this project</p>
                </div>
            ) : (
                <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                    {sorted.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            isEditing={editingId === note.id}
                            editForm={editForm}
                            onStartEdit={() => startEdit(note)}
                            onSubmitEdit={(e) => submitEdit(e, note.id)}
                            onCancelEdit={() => setEditingId(null)}
                            onDelete={() => deleteNote(note.id)}
                            onToggleItem={(itemId) => toggleItem(note.id, itemId)}
                            onRemoveItem={(itemId) => removeItem(note.id, itemId)}
                            onAddItem={(text) => addItem(note.id, text)}
                            onClearCompleted={() => clearCompletedItems(note.id)}
                        />
                    ))}
                </ul>
            )}
                </>
            )}
            {ConfirmDialog}
        </div>
    );
}

function HeaderIconButton({ onClick, href, title, children, className: extraClassName = '' }) {
    const className = `flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 ${extraClassName}`;
    if (href) {
        return <Link href={href} title={title} className={className}>{children}</Link>;
    }
    return <button onClick={onClick} title={title} className={className}>{children}</button>;
}

function LeaveProjectModal({ show, onClose, project, form, onSubmit }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <form onSubmit={onSubmit} className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Leave "{project.name}"?
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Let the project owner and managers know why you're leaving - it helps them plan around it.
                </p>

                <div className="mt-4">
                    <InputLabel htmlFor="leave-reason" value="Reason for leaving" />
                    <textarea
                        id="leave-reason"
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        rows={3}
                        autoFocus
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        placeholder="e.g. Moving to a different project, workload, no longer relevant to my role..."
                    />
                    <InputError message={form.errors.reason} className="mt-1" />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                        {form.processing && <Spinner className="mr-2 h-4 w-4" />}
                        {form.processing ? 'Leaving...' : 'Leave Project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Team/Tasks/Notes tab bar for the mobile horizontally-snapping pane
 * scroller. Kept as its own component (instead of inline state in the huge
 * Show page) so the scroll listener's re-renders stay scoped to this small
 * bar - tracking the active pane used to live in Show itself, which
 * re-rendered the entire page (task list, forms, everything) on every
 * scroll frame and caused visible jank / layout glitches mid-swipe.
 */
function MobilePaneTabs({ tabBarRef, columnsScrollRef, panes }) {
    const [activePane, setActivePane] = useState(panes[1]?.label ?? panes[0]?.label);

    useEffect(() => {
        const container = columnsScrollRef.current;
        if (!container) return;

        let ticking = false;
        const measure = () => {
            ticking = false;
            const containerCenter = container.scrollLeft + container.clientWidth / 2;
            let closest = panes[0];
            let closestDistance = Infinity;
            for (const pane of panes) {
                const el = pane.ref.current;
                if (!el) continue;
                const paneCenter = el.offsetLeft - container.offsetLeft + el.offsetWidth / 2;
                const distance = Math.abs(paneCenter - containerCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = pane;
                }
            }
            setActivePane((prev) => (prev === closest.label ? prev : closest.label));
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(measure);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        measure();

        return () => container.removeEventListener('scroll', handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={tabBarRef} className="mb-3 flex gap-1 rounded-md border border-gray-200 bg-gray-100 p-1 dark:border-transparent dark:bg-gray-800 lg:hidden">
            {panes.map(({ label, ref }) => (
                <button
                    key={label}
                    type="button"
                    onClick={() => ref.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })}
                    className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors duration-150 ${
                        activePane === label
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export default function Show({ project, role, myNotes, pendingInvitations }) {
    const { auth } = usePage().props;
    const { url } = usePage();
    const canManage = ['owner', 'manager'].includes(role);
    const canReview = ['owner', 'manager', 'tester'].includes(role);
    const isOwner = project.owner_id === auth.user.id;
    // A trashed project (soft-deleted, still inside its grace period) is
    // reachable for viewing/downloading only - every write route on the
    // backend stays on non-trashed model binding, so gate the obvious
    // mutating controls here too rather than letting them 404 silently.
    const isTrashed = !!project.deleted_at;

    const [memberSearch, setMemberSearch] = useState('');
    const [taskSearch, setTaskSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const { confirm, ConfirmDialog } = useConfirm();
    const { askMuteScope, MuteScopeDialog } = useMuteScope();
    const [bulkAction, setBulkAction] = useState({status: '',priority: '',assigned_to: '',});
    const [bulkTouched, setBulkTouched] = useState({status: false,priority: false,assigned_to: false,});
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const toggleTaskSelect = (taskId) => {setSelectedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
    };

    const clearSelection = () => setSelectedTaskIds([]);

    const runBulkAction = async (action, extra = {}) => {
        if (selectedTaskIds.length === 0) return;
        if (action === 'delete' && !(await confirm(`Delete ${selectedTaskIds.length} task(s)? This can't be undone.`, { title: 'Delete Selected Tasks?', danger: true, confirmLabel: 'Delete' }))) return;

        setBulkProcessing(true);
        router.post(route('tasks.bulk', project.id), { task_ids: selectedTaskIds, action, ...extra }, {
            preserveScroll: true,
            onSuccess: () => setSelectedTaskIds([]),
            onFinish: () => setBulkProcessing(false),
        });
    };

    const saveBulkChanges = async () => {
        if (selectedTaskIds.length === 0) return;

        const ids = selectedTaskIds;
        const jobs = [];
        if (bulkTouched.status) jobs.push({ action: 'status', extra: { status: bulkAction.status } });
        if (bulkTouched.priority) jobs.push({ action: 'priority', extra: { priority: bulkAction.priority } });
        if (bulkTouched.assigned_to) jobs.push({ action: 'assign', extra: { assigned_to: bulkAction.assigned_to || null } });
        if (jobs.length === 0) return;

        setBulkProcessing(true);
        for (const job of jobs) {
            await new Promise((resolve) => {
                router.post(route('tasks.bulk', project.id), { task_ids: ids, action: job.action, ...job.extra }, {
                    preserveScroll: true,
                    onFinish: resolve,
                });
            });
        }
        setBulkProcessing(false);
        setBulkTouched({ status: false, priority: false, assigned_to: false });
        setSelectedTaskIds([]);
    };
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [autoOpenHistoryTaskId, setAutoOpenHistoryTaskId] = useState(null);
    const [autoOpenChecklistTaskId, setAutoOpenChecklistTaskId] = useState(null);
    const [autoOpenCommentId, setAutoOpenCommentId] = useState(null);

    const jumpToTaskInList = (taskId) => {
        setViewMode('list');
        setShowBoardModal(false);
        clearTaskFilters();
        setHighlightedTaskId(taskId);
        setTimeout(() => {
            document.getElementById(`task-${taskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        setTimeout(() => setHighlightedTaskId(null), 3000);
    };
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showBoardModal, setShowBoardModal] = useState(false);
    useLandscapeOnOpen(showBoardModal);

    // Mobile swipeable panes: Team <-> Tasks <-> Notes, opening on Tasks.
    const teamPaneRef = useRef(null);
    const tasksPaneRef = useRef(null);
    const taskToolbarRef = useRef(null);
    const notesPaneRef = useRef(null);
    const columnsScrollRef = useRef(null);
    const tabBarRef = useRef(null);

    useEffect(() => {
        // Open on the Tasks pane by default (mobile only; inert on desktop's grid layout).
        tasksPaneRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, []);

    const memberForm = useForm({ emails: [], role: 'member' });
    // Text currently typed in the invite search box, kept separate from
    // memberForm.data.emails (the committed chip list) so picking a result
    // or pressing Enter can clear the field without touching what's already
    // queued to be invited.
    const [inviteEmailInput, setInviteEmailInput] = useState('');
    const taskForm = useForm({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium', dependencies: [] });
    const [newTaskDependencyPick, setNewTaskDependencyPick] = useState('');
    const leaveForm = useForm({ reason: '' });

    useEcho(`project.${project.id}`, ['.comment.posted', '.comment.deleted', '.comment.updated'], () => {
        router.reload({ only: ['project'] });
    });

    // Fires whenever any task's shared state changes - created, edited, deleted,
    // moved through the status lifecycle, reassigned, or touched by a bulk action -
    // from anyone else viewing this project, so the board, task list, and an open
    // task focus modal all stay live without a manual refresh. Also covers a
    // checklist item being checked/unchecked, which can mirror into a linked
    // "My Notes" item (see TaskChecklistItemController::syncNoteItems) - so
    // myNotes is refreshed alongside project to pick that up too, e.g. when the
    // same person has this project open in a second tab.
    useEcho(`project.${project.id}`, ['.task.changed'], () => {
        router.reload({ only: ['project', 'myNotes'] });
    });

    useEcho(`project.${project.id}`, ['.project.deletion_requested', '.project.deletion_cancelled'], () => {
        router.reload({ only: ['project'] });
    });

    // Fires whenever this project's roster changes - an invitation sent, cancelled,
    // accepted, or denied; a role change; a member removed; or a member leaving -
    // whether triggered from this browser tab or another manager's, so the Members
    // and Pending Invitations lists stay in sync without anyone refreshing the page.
    useEcho(`project.${project.id}`, ['.roster.updated'], () => {
        router.reload({ only: ['project', 'pendingInvitations'] });
    });

    const cancelDeletion = async () => {
        if (await confirm(`Cancel the pending deletion of "${project.name}"? It will stay exactly as it is.`, { title: 'Cancel Deletion Request?' })) {
            router.post(route('projects.deletion.cancel', project.id));
        }
    };

    const [resendingDeletion, setResendingDeletion] = useState(false);
    const [deletionCooldown, setDeletionCooldown] = useState(secondsUntilResendAvailable(project.deletion_email_sent_at));

    useEffect(() => {
        setDeletionCooldown(secondsUntilResendAvailable(project.deletion_email_sent_at));
    }, [project.deletion_email_sent_at]);

    useEffect(() => {
        if (deletionCooldown <= 0) return;
        const timer = setInterval(() => setDeletionCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(timer);
    }, [deletionCooldown > 0]);

    const resendDeletionEmail = () => {
        setResendingDeletion(true);
        router.post(route('projects.deletion.resend', project.id), {}, {
            preserveScroll: true,
            onFinish: () => setResendingDeletion(false),
        });
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const taskId = params.get('task');
        if (!taskId) return;
        if (params.get('history') === '1') {
            setAutoOpenHistoryTaskId(Number(taskId));
        }
        if (params.get('checklist') === '1') {
            setAutoOpenChecklistTaskId(Number(taskId));
        }
        const commentId = params.get('comment');
        if (commentId) {
            // A comment link should land on and highlight the comment itself
            // (handled by TaskRow's own autoOpenCommentId effect below), not the
            // task row - so skip the task-level highlight/scroll entirely here.
            setAutoOpenCommentId(Number(commentId));
            return;
        }
        setHighlightedTaskId(Number(taskId));
        const scrollTimer = setTimeout(() => {
            document.getElementById(`task-${taskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        const clearTimer = setTimeout(() => setHighlightedTaskId(null), 3000);
        return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, [url]);

    const addInvitee = (email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;
        memberForm.setData((data) => (
            data.emails.includes(trimmed) ? data : { ...data, emails: [...data.emails, trimmed] }
        ));
    };

    const removeInvitee = (email) => {
        memberForm.setData((data) => ({ ...data, emails: data.emails.filter((e) => e !== email) }));
    };

    const submitMember = (e) => {
        e.preventDefault();
        // Anything still sitting typed in the search box (not yet turned
        // into a chip) is included too, so hitting "Send Invitations" never
        // silently drops the last person someone typed but didn't click.
        const pending = inviteEmailInput.trim().toLowerCase();
        const emails = pending && !memberForm.data.emails.includes(pending)
            ? [...memberForm.data.emails, pending]
            : memberForm.data.emails;

        if (emails.length === 0) return;

        memberForm.transform((data) => ({ ...data, emails }));
        memberForm.post(route('projects.members.store', project.id), {
            onSuccess: () => {
                memberForm.transform((data) => data);
                memberForm.reset();
                setInviteEmailInput('');
            },
            onError: () => {
                memberForm.transform((data) => data);
            },
        });
    };

    const submitTask = (e) => {
        e.preventDefault();
        taskForm.transform((data) => ({ ...data, due_date: localDateTimeToIso(data.due_date) }));
        taskForm.post(route('tasks.store', project.id), { preserveScroll: true, onSuccess: () => { taskForm.reset(); setNewTaskDependencyPick(''); setShowNewTaskForm(false); } });
    };

    const addNewTaskDependency = () => {
        if (!newTaskDependencyPick) return;
        const id = Number(newTaskDependencyPick);
        if (!taskForm.data.dependencies.includes(id)) {
            taskForm.setData('dependencies', [...taskForm.data.dependencies, id]);
        }
        setNewTaskDependencyPick('');
    };

    const removeNewTaskDependency = (id) => {
        taskForm.setData('dependencies', taskForm.data.dependencies.filter((depId) => depId !== id));
    };

    const [memberToRemove, setMemberToRemove] = useState(null);

    const changeRole = async (member, newRole) => {
        if (newRole === member.pivot.role) return;
        if (!(await confirm(`Change ${member.name}'s role to ${newRole}?`, { title: 'Change Member Role?' }))) return;
        router.patch(route('projects.members.update', [project.id, member.id]), { role: newRole });
    };

    const leaveProject = () => {
        leaveForm.reset('reason');
        leaveForm.clearErrors();
        setShowLeaveModal(true);
    };

    const [projectMuting, setProjectMuting] = useState(false);
    const toggleProjectMute = async () => {
        if (project.is_muted) {
            setProjectMuting(true);
            router.post(route('projects.unmute', project.id), {}, {
                preserveScroll: true,
                onFinish: () => setProjectMuting(false),
            });
            return;
        }

        const scope = await askMuteScope({
            title: 'Mute Notifications',
            message: `Choose which notifications to mute for every task in "${project.name}".`,
            defaultScope: project.mute_in_app && project.mute_email ? 'both' : project.mute_in_app ? 'in_app' : project.mute_email ? 'email' : 'both',
        });
        if (!scope) return;

        setProjectMuting(true);
        router.post(route('projects.mute', project.id), { scope }, {
            preserveScroll: true,
            onFinish: () => setProjectMuting(false),
        });
    };

    const submitLeave = (e) => {
        e.preventDefault();
        leaveForm.delete(route('projects.leave', project.id), {
            onSuccess: () => setShowLeaveModal(false),
        });
    };

    const clearTaskFilters = () => { setTaskSearch(''); setStatusFilter('all'); setPriorityFilter('all'); };

    const filteredMembers = useMemo(() => {
        const term = memberSearch.trim().toLowerCase();
        const list = term
            ? project.members.filter((m) =>
                  m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || m.pivot?.role?.toLowerCase().includes(term)
              )
            : project.members;

        return [...list].sort((a, b) => {
            const roleDiff = (ROLE_ORDER[a.pivot?.role] ?? 99) - (ROLE_ORDER[b.pivot?.role] ?? 99);
            if (roleDiff !== 0) return roleDiff;
            return a.name.localeCompare(b.name);
        });
    }, [project.members, memberSearch]);

    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

    const filteredTasks = useMemo(() => {
        const term = taskSearch.trim().toLowerCase();
        return project.tasks
            .filter((t) => {
                if (statusFilter !== 'all' && t.status !== statusFilter) return false;
                if (priorityFilter !== 'all' && (t.priority ?? 'medium') !== priorityFilter) return false;
                if (!term) return true;
                const titleMatch = t.title.toLowerCase().includes(term);
                const assigneeMatch = t.assignee?.name?.toLowerCase().includes(term);
                const unassignedMatch = !t.assignee && 'unassigned'.includes(term);
                return titleMatch || assigneeMatch || unassignedMatch;
            })
            .sort((a, b) => {
                const pinDiff = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
                if (pinDiff !== 0) return pinDiff;
                return (PRIORITY_ORDER[a.priority ?? 'medium'] ?? 1) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 1);
            });
    }, [project.tasks, taskSearch, statusFilter, priorityFilter]);

    const hasActiveTaskFilters = taskSearch.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all';
    const canLeave = !isOwner && role !== 'admin';

    // Mobile-only back navigation: on small screens there's no persistent sidebar
    // back to the project list, so give touch users a way back to wherever they
    // came from (project list, dashboard, a task deep-link, etc). Desktop keeps
    // its existing nav chrome, so this is hidden at sm and up.
    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(route('dashboard'));
        }
    };

    return (
        <AuthenticatedLayout headerMaxWidth="max-w-[1600px]" header={
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                    <HeaderIconButton onClick={goBack} title="Go back" className="-ms-2 shrink-0 sm:hidden">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </HeaderIconButton>
                    <span className="min-w-0 truncate">{project.name}</span>
                    {project.is_muted && (
                        <svg title="Notifications muted for this project" className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9M3 3l18 18" />
                        </svg>
                    )}
                </h2>
                <div className="flex shrink-0 items-center gap-1">
                    <HeaderIconButton onClick={toggleProjectMute} title={project.is_muted ? 'Unmute notifications for this project' : 'Mute notifications for this project'}>
                        {project.is_muted ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.17 9.17A3 3 0 0012 15a2.99 2.99 0 002.83-2M17.61 17.61A9 9 0 016 18v-6a8.96 8.96 0 011.09-4.29M12 3a3 3 0 013 3v2m3 2v1a9 9 0 01-.36 2.52" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        )}
                    </HeaderIconButton>

                    <ProjectMenu
                        project={project}
                        page="show"
                        isOwner={isOwner}
                        canManage={canManage}
                        onShowInfo={() => setShowInfoModal(true)}
                        canLeave={canLeave}
                        onLeave={leaveProject}
                    />
                </div>
            </div>
        }>
            <Head title={project.name} />
            <style>{`
                @media (min-width: 1024px) {
                    .project-columns {
                        display: grid;
                        grid-template-columns: 320px minmax(0, 920px) 320px;
                        justify-content: center;
                        overflow: visible;
                    }
                }
            `}</style>
            <div className="py-6 sm:py-12">
                <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
                    {isTrashed && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                            <span>
                                This project is in the trash{project.grace_ends_at ? ` and will be permanently deleted on ${new Date(project.grace_ends_at).toLocaleDateString()}` : ''}.
                                {' '}You can still view everything here and download deliverables, but nothing can be added or changed while it's trashed.
                            </span>
                            <SecondaryButton onClick={() => router.visit(route('projects.deliverables', project.id))}>View Deliverables</SecondaryButton>
                        </div>
                    )}
                    {!isTrashed && project.deletion_requested_at && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                            <span>
                                {isOwner
                                    ? 'You requested to delete this project. Check your email for the confirmation link - nothing has been deleted yet.'
                                    : "The project owner has requested to delete this project. It will move to trash once they confirm by email, and can still be restored for a few days after that."}
                            </span>
                            {isOwner && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <SecondaryButton onClick={cancelDeletion}>Cancel Deletion Request</SecondaryButton>
                                    <SecondaryButton onClick={resendDeletionEmail} disabled={resendingDeletion || deletionCooldown > 0}>
                                        {deletionCooldown > 0 ? `Resend Confirmation Email (${deletionCooldown}s)` : 'Resend Confirmation Email'}
                                    </SecondaryButton>
                                </div>
                            )}
                        </div>
                    )}
                    <MobilePaneTabs
                        tabBarRef={tabBarRef}
                        columnsScrollRef={columnsScrollRef}
                        panes={[
                            { label: 'Team', ref: teamPaneRef },
                            { label: 'Tasks', ref: tasksPaneRef },
                            { label: 'Notes', ref: notesPaneRef },
                        ]}
                    />
                    <div ref={columnsScrollRef} className="project-columns flex snap-x snap-mandatory items-start gap-6 overflow-x-auto scroll-smooth pb-1 lg:pb-0 lg:snap-none">

                        {/* LEFT: Team - Invite, Members, and Pending Invitations grouped together */}
                        <div ref={teamPaneRef} className="w-full shrink-0 snap-center snap-always space-y-4 lg:w-auto lg:shrink lg:snap-align-none lg:sticky lg:top-40 lg:self-start">
                            {canManage && !isTrashed && (
                                <div className="rounded-lg bg-white shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                    <button
                                        onClick={() => setShowInviteForm((v) => !v)}
                                        className="flex w-full items-center justify-between p-4"
                                    >
                                        <span className="flex items-center gap-2 text-sm font-semibold dark:text-gray-100">
                                            <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Invite a Member
                                        </span>
                                        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${showInviteForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showInviteForm && (
                                        <form onSubmit={submitMember} className="space-y-3 px-4 pb-4">
                                            <div>
                                                <InputLabel htmlFor="email" value="Name or Email" />
                                                <UserSearchInput
                                                    value={inviteEmailInput}
                                                    onChange={setInviteEmailInput}
                                                    onSelect={(user) => addInvitee(user.email)}
                                                    onEnter={(text) => addInvitee(text)}
                                                    placeholder={memberForm.data.emails.length > 0 ? 'Add another...' : 'Search by name or email...'}
                                                />
                                                {memberForm.data.emails.length > 0 && (
                                                    <div className="mb-1.5 mt-2 flex flex-wrap gap-1.5">
                                                        {memberForm.data.emails.map((email) => (
                                                            <span
                                                                key={email}
                                                                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                            >
                                                                {email}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeInvitee(email)}
                                                                    title="Remove"
                                                                    className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 dark:text-indigo-500 dark:hover:bg-indigo-900 dark:hover:text-indigo-300"
                                                                >
                                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Pick as many people as you'd like, then send - they'll all get the same role.</p>
                                                <InputError
                                                    message={
                                                        memberForm.errors.email
                                                        ?? memberForm.errors.emails
                                                        ?? Object.entries(memberForm.errors).find(([key]) => key.startsWith('emails.'))?.[1]
                                                    }
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="role" value="Role" />
                                                <FilterSelect id="role" className="mt-1" value={memberForm.data.role} onChange={(v) => memberForm.setData('role', v)} options={ROLE_OPTIONS} />
                                            </div>
                                            <button type="submit" disabled={memberForm.processing} className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:border-transparent dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                                                {memberForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                                {memberForm.data.emails.length > 1 ? `Send ${memberForm.data.emails.length} Invitations` : 'Send Invitation'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="rounded-lg bg-white p-4 shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <div className="mb-3 flex items-center gap-2">
                                    <h3 className="text-base font-semibold dark:text-gray-100">Members</h3>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                        {project.members.length}
                                    </span>
                                </div>
                                <SearchInput value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members or role..." className="mb-3 block w-full text-sm" />
                                <ul className="space-y-1 pr-1">
                                    {filteredMembers.map((member) => (
                                        <li key={member.id} className="rounded-md p-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <div className="flex items-start gap-2">
                                                <Avatar user={member} size="h-9 w-9" className="mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            <span className="min-w-0 truncate">{member.name}</span>
                                                            {member.deleted_at && (
                                                                <svg
                                                                    className="h-3.5 w-3.5 shrink-0 text-red-400 dark:text-red-500"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <title>Account pending deletion</title>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            )}
                                                        </p>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-sm capitalize ${roleStyles[member.pivot.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                                {member.pivot.role}
                                                            </span>
                                                            {canManage && !isTrashed && member.id !== project.owner_id && (isOwner || member.pivot.role !== 'manager') && (
                                                                <MemberActionsMenu currentRole={member.pivot.role} onChangeRole={(newRole) => changeRole(member, newRole)} onRemove={() => setMemberToRemove(member)} />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="break-all text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {filteredMembers.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No members match.</p>}
                                </ul>

                                {canManage && !isTrashed && pendingInvitations?.length > 0 && (
                                    <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Pending Invitations</p>
                                        <ul className="space-y-1.5">
                                            {pendingInvitations.map((inv) => (
                                                <li key={inv.id} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 p-2 dark:bg-gray-900/40">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm text-gray-700 dark:text-gray-300">{inv.invited_user.name}</p>
                                                        <p className="text-xs capitalize text-gray-400 dark:text-gray-500">{inv.role}</p>
                                                    </div>
                                                    <button
                                                        onClick={async () => { if (await confirm(`Cancel the invitation to ${inv.invited_user.name}?`, { title: 'Cancel Invitation?', danger: true, confirmLabel: 'Cancel Invitation' })) router.delete(route('projects.invitations.destroy', inv.id)); }}
                                                        className="shrink-0 text-xs text-red-500 hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MIDDLE: Tasks */}
                        <div ref={tasksPaneRef} className="w-full shrink-0 snap-center snap-always space-y-4 lg:w-auto lg:shrink lg:snap-align-none">
                            {canManage && !isTrashed && (
                                <>
                                    <button onClick={() => setShowNewTaskForm((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                        <span className="flex items-center gap-2 text-sm font-semibold dark:text-gray-100">
                                            <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            {showNewTaskForm ? 'Close New Task' : 'Create New Task'}
                                        </span>
                                        <svg className={`h-4 w-4 text-gray-400 transition-transform ${showNewTaskForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showNewTaskForm && (
                                        <div className="rounded-lg bg-white p-4 shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700 sm:p-6">
                                            <form onSubmit={submitTask} className="space-y-4">
                                                <div>
                                                    <InputLabel htmlFor="title" value="Title" />
                                                    <TextInput id="title" value={taskForm.data.title} onChange={(e) => taskForm.setData('title', e.target.value)} className="mt-1 block w-full" />
                                                    <InputError message={taskForm.errors.title} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="description" value="Description" />
                                                    <RichTextEditor
                                                        value={taskForm.data.description}
                                                        onChange={(html) => taskForm.setData('description', html)}
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <InputLabel htmlFor="assigned_to" value="Assign To" />
                                                        <FilterSelect
                                                            id="assigned_to"
                                                            className="mt-1"
                                                            value={taskForm.data.assigned_to}
                                                            onChange={(v) => taskForm.setData('assigned_to', v)}
                                                            options={[{ value: '', label: 'Unassigned' }, ...project.members.map((m) => ({ value: m.id, label: m.name, avatar: m }))]}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <InputLabel htmlFor="due_date" value="Due Date & Time" />
                                                        <TextInput id="due_date" type="datetime-local" step="1" value={taskForm.data.due_date} onChange={(e) => taskForm.setData('due_date', e.target.value)} className="mt-1 block w-full" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <InputLabel htmlFor="priority" value="Priority" />
                                                        <FilterSelect id="priority" className="mt-1" value={taskForm.data.priority} onChange={(v) => taskForm.setData('priority', v)} options={PRIORITY_OPTIONS} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="dependencies" value="Dependencies" />
                                                    {taskForm.data.dependencies.length > 0 && (
                                                        <ul className="mt-1 space-y-1">
                                                            {taskForm.data.dependencies.map((id) => {
                                                                const dep = project.tasks.find((t) => t.id === id);
                                                                return (
                                                                    <li key={id} className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-sm dark:bg-gray-900/40">
                                                                        <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{dep?.title ?? `Task #${id}`}</span>
                                                                        <RemoveButton onClick={() => removeNewTaskDependency(id)} />
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <FilterSelect
                                                            value={newTaskDependencyPick}
                                                            onChange={setNewTaskDependencyPick}
                                                            options={[
                                                                { value: '', label: 'Add a dependency…' },
                                                                ...project.tasks
                                                                    .filter((t) => !taskForm.data.dependencies.includes(t.id))
                                                                    .map((t) => ({
                                                                        value: t.id,
                                                                        label: t.title,
                                                                        badge: { label: t.status.replace('_', ' '), className: statusPillStyles[t.status] ?? 'bg-gray-100 text-gray-600' },
                                                                    })),
                                                            ]}
                                                        />
                                                        <SecondaryButton type="button" onClick={addNewTaskDependency} disabled={!newTaskDependencyPick}>Add</SecondaryButton>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <PrimaryButton disabled={taskForm.processing}>
                                                        {taskForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                                        Create Task
                                                    </PrimaryButton>
                                                    <SecondaryButton type="button" onClick={() => setShowNewTaskForm(false)}>Cancel</SecondaryButton>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}

                            <div ref={taskToolbarRef} className="rounded-lg bg-white p-4 shadow border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold dark:text-gray-100">Tasks</h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">{project.tasks.length}</span>
                                        <div className="ml-2 flex rounded-md border border-gray-200 p-0.5 dark:border-gray-700">
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`rounded px-2 py-1 text-xs font-medium ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                                            >
                                                List
                                            </button>
                                            <button
                                                onClick={() => setShowBoardModal(true)}
                                                className={`rounded px-2 py-1 text-xs font-medium ${showBoardModal ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                                            >
                                                Board
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SearchInput value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Search by task or assignee..." className="w-56 text-sm" />
                                        <FiltersMenu activeCount={[statusFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length} onClear={clearTaskFilters}>
                                            <FiltersMenu.Row label="Status">
                                                <FilterSelect className="w-full" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
                                            </FiltersMenu.Row>
                                            <FiltersMenu.Row label="Priority">
                                                <FilterSelect className="w-full" value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_FILTER_OPTIONS} />
                                            </FiltersMenu.Row>
                                        </FiltersMenu>
                                    </div>
                                </div>
                                <TaskStatusBar tasks={project.tasks} />
                                {viewMode === 'list' && hasActiveTaskFilters && (
                                    <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Showing {filteredTasks.length} of {project.tasks.length} tasks</p>
                                )}
                            </div>

                            {viewMode === 'list' && canManage && !isTrashed && selectedTaskIds.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950">
                                    <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">{selectedTaskIds.length} selected</span>
                                    <FilterSelect
                                        className="w-24"
                                        value={bulkAction.status}
                                        onChange={(v) => { setBulkAction((s) => ({ ...s, status: v })); setBulkTouched((t) => ({ ...t, status: true })); }}
                                        options={STATUS_OPTIONS.filter((s) => s.value !== 'all')}
                                    />

                                    <FilterSelect
                                        className="w-24"
                                        value={bulkAction.priority}
                                        onChange={(v) => { setBulkAction((s) => ({ ...s, priority: v })); setBulkTouched((t) => ({ ...t, priority: true })); }}
                                        options={PRIORITY_OPTIONS}
                                    />

                                    <FilterSelect
                                        className="w-40"
                                        value={bulkAction.assigned_to}
                                        onChange={(v) => { setBulkAction((s) => ({ ...s, assigned_to: v })); setBulkTouched((t) => ({ ...t, assigned_to: true })); }}
                                        options={[{ value: '', label: 'Unassigned' }, ...project.members.map((m) => ({ value: m.id, label: m.name, avatar: m }))]}
                                    />

                                    <PrimaryButton
                                        disabled={bulkProcessing || !(bulkTouched.status || bulkTouched.priority || bulkTouched.assigned_to)}
                                        onClick={saveBulkChanges}
                                    >
                                        Save Changes
                                    </PrimaryButton>

                                    <DangerButton disabled={bulkProcessing} onClick={() => runBulkAction('delete')}>Delete</DangerButton>
                                    <button
                                        onClick={() => { clearSelection(); setBulkTouched({ status: false, priority: false, assigned_to: false }); }}
                                        className="ml-auto text-sm text-indigo-700 hover:underline dark:text-indigo-300"
                                    >
                                        Clear selection
                                    </button>
                                </div>
                            )}

                            {viewMode === 'list' && (
                            <div className="space-y-3">
                                {filteredTasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        currentUserId={auth.user.id}
                                        canManage={canManage && !isTrashed}
                                        canReview={canReview && !isTrashed}
                                        isTrashed={isTrashed}
                                        isHighlighted={task.id === highlightedTaskId}
                                        autoOpenHistory={task.id === autoOpenHistoryTaskId}
                                        autoOpenChecklist={task.id === autoOpenChecklistTaskId}
                                        autoOpenCommentId={autoOpenCommentId}
                                        members={project.members}
                                        selectable={canManage && !isTrashed}
                                        selected={selectedTaskIds.includes(task.id)}
                                        onToggleSelect={toggleTaskSelect}
                                        allTasks={project.tasks}
                                        onJumpToTask={jumpToTaskInList}
                                        projectMuted={!!project.is_muted}
                                    />
                                ))}
                                {filteredTasks.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.tasks.length === 0 ? 'No tasks yet.' : 'No tasks match your filters.'}</p>
                                        {project.tasks.length > 0 && hasActiveTaskFilters && (
                                            <button onClick={clearTaskFilters} className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Clear filters</button>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}
                        </div>

                        {/* RIGHT: My Notes - personal scratchpad, decoupled from team management */}
                        <div ref={notesPaneRef} className="w-full shrink-0 snap-center snap-always space-y-4 lg:w-auto lg:shrink lg:snap-align-none lg:sticky lg:top-40 lg:self-start">
                            <NotesPanel project={project} myNotes={myNotes} />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                show={showBoardModal}
                onClose={() => setShowBoardModal(false)}
                maxWidth="7xl"
                overlayClassName="bg-black/55 dark:bg-black/70"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Board</h3>
                        <button
                            onClick={() => setShowBoardModal(false)}
                            aria-label="Close"
                            className="shrink-0 rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4">
                        <TaskBoard tasks={filteredTasks} canManage={canManage && !isTrashed} canReview={canReview && !isTrashed} isTrashed={isTrashed} currentUserId={auth.user.id} projectId={project.id} onCardClick={(task) => jumpToTaskInList(task.id)} />
                    </div>
                </div>
            </Modal>

            <RemoveMemberModal
                project={project}
                member={memberToRemove}
                show={!!memberToRemove}
                onClose={() => setMemberToRemove(null)}
            />

            <ProjectInfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} project={project} />
            <LeaveProjectModal
                show={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                project={project}
                form={leaveForm}
                onSubmit={submitLeave}
            />
            {ConfirmDialog}
            {MuteScopeDialog}

            {viewMode === 'list' && <ScrollToPaginationButton targetRef={tabBarRef} />}
        </AuthenticatedLayout>
    );
}
