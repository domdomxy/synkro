import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Avatar from '@/Components/Avatar';
import TaskRow from '@/Components/TaskRow';
import UserSearchInput from '@/Components/UserSearchInput';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const roleStyles = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    tester: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    admin: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const statusBarColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    submitted: 'bg-yellow-500',
    in_review: 'bg-purple-500',
    done: 'bg-green-500',
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
];

function SearchIcon() {
    return (
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
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

function NoteKebabMenu({ onEdit, onDelete }) {
    const MENU_WIDTH = 128;
    const { open, setOpen, coords, btnRef, menuRef, toggle } = useFixedDropdown(MENU_WIDTH);

    return (
        <>
            <button ref={btnRef} onClick={toggle} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {open && (
                <div ref={menuRef} style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }} className="z-50 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <button onClick={() => { setOpen(false); onEdit(); }} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Edit</button>
                    <button onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">Delete</button>
                </div>
            )}
        </>
    );
}

function NotesPanel({ project, myNotes }) {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const panelRef = useRef(null);

    const newForm = useForm({ title: '', content: '' });
    const editForm = useForm({ title: '', content: '' });
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const submitNew = (e) => {
        e.preventDefault();
        newForm.post(route('projects.notes.store', project.id), { onSuccess: () => { newForm.reset(); setShowNewForm(false); } });
    };

    const startEdit = (note) => {
        setEditingId(note.id);
        editForm.setData({ title: note.title ?? '', content: note.content });
    };

    const submitEdit = (e, noteId) => {
        e.preventDefault();
        editForm.patch(route('projects.notes.update', noteId), { onSuccess: () => setEditingId(null) });
    };

    const deleteNote = (noteId) => { if (confirm('Delete this note?')) router.delete(route('projects.notes.destroy', noteId)); };

    const clearAll = () => {
        if (confirm('Clear all your notes on this project? This cannot be undone.')) {
            router.delete(route('projects.notes.clear', project.id));
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-sm font-semibold dark:text-gray-100">My Notes</span>
                    {myNotes.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{myNotes.length}</span>
                    )}
                </div>
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 z-10 mt-1 w-full rounded-lg bg-white p-4 shadow-xl ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Visible only to you</p>
                        <div className="flex items-center gap-3">
                            {myNotes.length > 0 && <button onClick={clearAll} className="text-xs font-medium text-red-500 hover:underline">Clear all</button>}
                            <button onClick={() => setShowNewForm((v) => !v)} className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500">
                                {showNewForm ? 'Cancel' : (
                                    <>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Note
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {showNewForm && (
                        <form onSubmit={submitNew} className="mb-3 space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                            <input type="text" placeholder="Title (optional)" value={newForm.data.title} onChange={(e) => newForm.setData('title', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                            <textarea placeholder="Write your note..." value={newForm.data.content} onChange={(e) => newForm.setData('content', e.target.value)} rows={3} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" autoFocus />
                            <InputError message={newForm.errors.content} />
                            <button type="submit" disabled={newForm.processing} className="w-full rounded-md bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Save Note</button>
                        </form>
                    )}

                    <div className="max-h-64 space-y-2 overflow-y-auto">
                        {myNotes.length === 0 && !showNewForm && (
                            <div className="flex flex-col items-center py-6 text-center">
                                <svg className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m3 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-gray-400 dark:text-gray-500">No notes yet</p>
                                <p className="text-xs text-gray-300 dark:text-gray-600">Jot down anything private about this project</p>
                            </div>
                        )}
                        {myNotes.map((note) => {
                            const isLong = note.content.length > 140;
                            const isExpanded = expandedId === note.id;
                            return (
                                <div key={note.id} className="rounded-md border border-gray-100 p-3 transition hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600">
                                    {editingId === note.id ? (
                                        <form onSubmit={(e) => submitEdit(e, note.id)} className="space-y-2">
                                            <input type="text" placeholder="Title (optional)" value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" />
                                            <textarea value={editForm.data.content} onChange={(e) => editForm.setData('content', e.target.value)} rows={3} className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" autoFocus />
                                            <div className="flex gap-2">
                                                <button type="submit" disabled={editForm.processing} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500">Save</button>
                                                <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:underline dark:text-gray-400">Cancel</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    {note.title && <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{note.title}</p>}
                                                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{new Date(note.updated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                                </div>
                                                <NoteKebabMenu onEdit={() => startEdit(note)} onDelete={() => deleteNote(note.id)} />
                                            </div>
                                            <p className={`mt-1.5 break-words text-sm text-gray-600 dark:text-gray-400 ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>{note.content}</p>
                                            {isLong && (
                                                <button onClick={() => setExpandedId(isExpanded ? null : note.id)} className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                                                    {isExpanded ? 'Show less' : 'Show more'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function HeaderIconButton({ onClick, href, title, children }) {
    const className = "flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200";
    if (href) {
        return <Link href={href} title={title} className={className}>{children}</Link>;
    }
    return <button onClick={onClick} title={title} className={className}>{children}</button>;
}

function ProjectInfoModal({ show, onClose, project }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="flex max-h-[80vh] flex-col">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 p-6 pb-4 dark:border-gray-700">
                    <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h2>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Project ID: {project.id}</p>
                    </div>
                    <button onClick={onClose} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Description</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-base text-gray-900 dark:text-gray-100">
                        {project.description || <span className="text-gray-400 dark:text-gray-500">No description provided.</span>}
                    </p>
                </div>

                <div className="flex justify-end border-t border-gray-100 p-4 dark:border-gray-700">
                    <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}

export default function Show({ project, role, myNotes }) {
    const { auth } = usePage().props;
    const { url } = usePage();
    const canManage = ['owner', 'manager'].includes(role);
    const canReview = ['owner', 'tester'].includes(role);
    const isOwner = project.owner_id === auth.user.id;

    const [memberSearch, setMemberSearch] = useState('');
    const [taskSearch, setTaskSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    const memberForm = useForm({ email: '', role: 'member' });
    const taskForm = useForm({ title: '', description: '', assigned_to: '', due_date: '' });

    useEcho(`project.${project.id}`, ['.comment.posted', '.comment.deleted'], () => {
        router.reload({ only: ['project'] });
    });

    useEffect(() => {
        const taskId = new URLSearchParams(window.location.search).get('task');
        if (!taskId) return;
        setHighlightedTaskId(Number(taskId));
        const scrollTimer = setTimeout(() => {
            document.getElementById(`task-${taskId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        const clearTimer = setTimeout(() => setHighlightedTaskId(null), 3000);
        return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
    }, [url]);

    const submitMember = (e) => {
        e.preventDefault();
        memberForm.post(route('projects.members.store', project.id), { onSuccess: () => memberForm.reset() });
    };

    const submitTask = (e) => {
        e.preventDefault();
        taskForm.post(route('tasks.store', project.id), { onSuccess: () => { taskForm.reset(); setShowNewTaskForm(false); } });
    };

    const removeMember = (member) => {
        if (confirm(`Remove ${member.name} from this project?`)) {
            router.delete(route('projects.members.destroy', [project.id, member.id]));
        }
    };

    const changeRole = (member, newRole) => {
        if (newRole === member.pivot.role) return;
        if (!confirm(`Change ${member.name}'s role to ${newRole}?`)) return;
        router.patch(route('projects.members.update', [project.id, member.id]), { role: newRole });
    };

    const leaveProject = () => {
        if (confirm(`Leave "${project.name}"?`)) router.delete(route('projects.leave', project.id));
    };

    const clearTaskFilters = () => { setTaskSearch(''); setStatusFilter('all'); };

    const filteredMembers = useMemo(() => {
        const term = memberSearch.trim().toLowerCase();
        if (!term) return project.members;
        return project.members.filter((m) =>
            m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term) || m.pivot?.role?.toLowerCase().includes(term)
        );
    }, [project.members, memberSearch]);

    const filteredTasks = useMemo(() => {
        const term = taskSearch.trim().toLowerCase();
        return project.tasks.filter((t) => {
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            if (!term) return true;
            const titleMatch = t.title.toLowerCase().includes(term);
            const assigneeMatch = t.assignee?.name?.toLowerCase().includes(term);
            const unassignedMatch = !t.assignee && 'unassigned'.includes(term);
            return titleMatch || assigneeMatch || unassignedMatch;
        });
    }, [project.tasks, taskSearch, statusFilter]);

    const hasActiveTaskFilters = taskSearch.trim() !== '' || statusFilter !== 'all';
    const canLeave = !isOwner && role !== 'admin';

    return (
        <AuthenticatedLayout header={
            <div className="sticky top-16 z-30 -mx-4 -my-6 flex items-center justify-between gap-3 bg-white/95 px-4 py-4 backdrop-blur dark:bg-gray-800/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <h2 className="min-w-0 truncate text-xl font-semibold text-gray-800 dark:text-gray-200">{project.name}</h2>
                <div className="flex shrink-0 items-center gap-1">
                    <HeaderIconButton onClick={() => setShowInfoModal(true)} title="Project Info">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </HeaderIconButton>
                    {canManage && (
                        <HeaderIconButton href={route('projects.settings', project.id)} title={isOwner ? 'Owner Settings' : 'Manager Settings'}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </HeaderIconButton>
                    )}
                    {canLeave && (
                        <HeaderIconButton onClick={leaveProject} title="Leave Project">
                            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </HeaderIconButton>
                    )}
                </div>
            </div>
        }>
            <Head title={project.name} />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr_280px]">

                        {/* LEFT — Invite + Notes */}
                        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
                            {canManage && (
                                <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                    <h3 className="mb-3 text-base font-semibold dark:text-gray-100">Invite a Member</h3>
                                    <form onSubmit={submitMember} className="space-y-3">
                                        <div>
                                            <InputLabel htmlFor="email" value="Name or Email" />
                                            <UserSearchInput value={memberForm.data.email} onChange={(val) => memberForm.setData('email', val)} />
                                            <InputError message={memberForm.errors.email} className="mt-2" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="role" value="Role" />
                                            <select id="role" value={memberForm.data.role} onChange={(e) => memberForm.setData('role', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                                <option value="manager">Manager</option>
                                                <option value="member">Member</option>
                                                <option value="tester">Tester</option>
                                            </select>
                                        </div>
                                        <PrimaryButton disabled={memberForm.processing}>Add</PrimaryButton>
                                    </form>
                                </div>
                            )}

                            <NotesPanel project={project} myNotes={myNotes} />
                        </div>

                        {/* MIDDLE — Tasks */}
                        <div className="space-y-4">
                            {canManage && (
                                <>
                                    <button onClick={() => setShowNewTaskForm((v) => !v)} className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
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
                                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                            <form onSubmit={submitTask} className="space-y-4">
                                                <div>
                                                    <InputLabel htmlFor="title" value="Title" />
                                                    <TextInput id="title" value={taskForm.data.title} onChange={(e) => taskForm.setData('title', e.target.value)} className="mt-1 block w-full" />
                                                    <InputError message={taskForm.errors.title} className="mt-2" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="description" value="Description" />
                                                    <textarea id="description" value={taskForm.data.description} onChange={(e) => taskForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" rows={3} />
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <InputLabel htmlFor="assigned_to" value="Assign To" />
                                                        <select id="assigned_to" value={taskForm.data.assigned_to} onChange={(e) => taskForm.setData('assigned_to', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                                            <option value="">Unassigned</option>
                                                            {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <InputLabel htmlFor="due_date" value="Due Date & Time" />
                                                        <TextInput id="due_date" type="datetime-local" step="1" value={taskForm.data.due_date} onChange={(e) => taskForm.setData('due_date', e.target.value)} className="mt-1 block w-full" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <PrimaryButton disabled={taskForm.processing}>Create Task</PrimaryButton>
                                                    <SecondaryButton type="button" onClick={() => setShowNewTaskForm(false)}>Cancel</SecondaryButton>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold dark:text-gray-100">Tasks</h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">{project.tasks.length}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <SearchInput value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Search by task or assignee..." className="w-48 text-sm" />
                                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        {hasActiveTaskFilters && <button onClick={clearTaskFilters} className="text-sm text-gray-500 hover:underline dark:text-gray-400">Clear</button>}
                                    </div>
                                </div>
                                <TaskStatusBar tasks={project.tasks} />
                                {hasActiveTaskFilters && (
                                    <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Showing {filteredTasks.length} of {project.tasks.length} tasks</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                {filteredTasks.map((task) => (
                                    <TaskRow key={task.id} task={task} currentUserId={auth.user.id} canManage={canManage} canReview={canReview} isHighlighted={task.id === highlightedTaskId} members={project.members} />
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
                        </div>

                        {/* RIGHT — Members */}
                        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="mb-3 flex items-center gap-2">
                                    <h3 className="text-base font-semibold dark:text-gray-100">Members</h3>
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                        {project.members.length}
                                    </span>
                                </div>
                                <SearchInput value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members or role..." className="mb-3 block w-full text-sm" />
                                <ul
                                    className="space-y-1 overflow-y-auto pr-1"
                                    style={{ maxHeight: filteredMembers.length > 6 ? '18rem' : 'none' }}
                                >
                                    {filteredMembers.map((member) => (
                                        <li key={member.id} className="rounded-md p-1.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <div className="flex items-start gap-2">
                                                <Avatar user={member} size="h-9 w-9" className="mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                                                        {canManage && member.id !== project.owner_id && (
                                                            <MemberActionsMenu currentRole={member.pivot.role} onChangeRole={(newRole) => changeRole(member, newRole)} onRemove={() => removeMember(member)} />
                                                        )}
                                                    </div>
                                                    <p className="break-all text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                                                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-sm capitalize ${roleStyles[member.pivot.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                        {member.pivot.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {filteredMembers.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No members match.</p>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectInfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} project={project} />
        </AuthenticatedLayout>
    );
}
