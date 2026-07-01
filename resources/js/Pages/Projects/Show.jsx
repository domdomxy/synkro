import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import Avatar from '@/Components/Avatar';
import TaskRow from '@/Components/TaskRow';
import UserSearchInput from '@/Components/UserSearchInput';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useMemo, useState } from 'react';

const roleStyles = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    tester: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    admin: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function Show({ project, role, myNote }) {
    const { auth } = usePage().props;
    const { url } = usePage();
    const canManage = ['owner', 'manager'].includes(role);
    const canReview = ['owner', 'tester'].includes(role);
    const isOwner = project.owner_id === auth.user.id;

    const [memberSearch, setMemberSearch] = useState('');
    const [taskSearch, setTaskSearch] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);

    const memberForm = useForm({ email: '', role: 'member' });
    const taskForm = useForm({ title: '', description: '', assigned_to: '', due_date: '' });
    const noteForm = useForm({ content: myNote });
    const [noteSaved, setNoteSaved] = useState(false);

    const saveNote = () => {
        noteForm.patch(route('projects.note.update', project.id), {
            preserveScroll: true,
            onSuccess: () => {
                setNoteSaved(true);
                setTimeout(() => setNoteSaved(false), 2000);
            },
        });
    };

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

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(clearTimer);
        };
    }, [url]);

    const submitMember = (e) => {
        e.preventDefault();
        memberForm.post(route('projects.members.store', project.id), { onSuccess: () => memberForm.reset() });
    };

    const submitTask = (e) => {
        e.preventDefault();
        taskForm.post(route('tasks.store', project.id), { onSuccess: () => taskForm.reset() });
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
        if (confirm(`Leave "${project.name}"?`)) {
            router.delete(route('projects.leave', project.id));
        }
    };

    const filteredMembers = useMemo(() => {
        const term = memberSearch.trim().toLowerCase();
        if (!term) return project.members;
        return project.members.filter((m) => m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term));
    }, [project.members, memberSearch]);

    const filteredTasks = useMemo(() => {
        const term = taskSearch.trim().toLowerCase();
        if (!term) return project.tasks;
        return project.tasks.filter((t) => t.title.toLowerCase().includes(term));
    }, [project.tasks, taskSearch]);

    return (
        <AuthenticatedLayout header={<h2 className="break-words text-xl font-semibold text-gray-800 dark:text-gray-200">{project.name}</h2>}>
            <Head title={project.name} />
            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr_280px]">

                        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <h3 className="mb-3 text-base font-semibold dark:text-gray-100">Members</h3>
                                <TextInput
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Search members..."
                                    className="mb-3 block w-full text-sm"
                                />
                                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                    {filteredMembers.map((member) => (
                                        <li key={member.id} className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Avatar user={member} size="h-7 w-7" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                                                    {canManage && member.id !== project.owner_id ? (
                                                        <select
                                                            value={member.pivot.role}
                                                            onChange={(e) => changeRole(member, e.target.value)}
                                                            className="mt-0.5 rounded-md border-gray-300 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                        >
                                                            <option value="manager">manager</option>
                                                            <option value="member">member</option>
                                                            <option value="tester">tester</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${roleStyles[member.pivot.role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                            {member.pivot.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {canManage && member.id !== project.owner_id && (
                                                <button onClick={() => removeMember(member)} className="shrink-0 text-xs text-red-500 hover:underline">
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                    {filteredMembers.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No members match.</p>}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {canManage && (
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="mb-4 text-lg font-semibold dark:text-gray-100">New Task</h3>
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
                                                    {project.members.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <InputLabel htmlFor="due_date" value="Due Date & Time" />
                                                <TextInput id="due_date" type="datetime-local" step="1" value={taskForm.data.due_date} onChange={(e) => taskForm.setData('due_date', e.target.value)} className="mt-1 block w-full" />
                                            </div>
                                        </div>
                                        <PrimaryButton disabled={taskForm.processing}>Create Task</PrimaryButton>
                                    </form>
                                </div>
                            )}

                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold dark:text-gray-100">Tasks</h3>
                                    <TextInput
                                        value={taskSearch}
                                        onChange={(e) => setTaskSearch(e.target.value)}
                                        placeholder="Search tasks..."
                                        className="w-56 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredTasks.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        currentUserId={auth.user.id}
                                        canManage={canManage}
                                        canReview={canReview}
                                        isHighlighted={task.id === highlightedTaskId}
                                        members={project.members}
                                    />
                                ))}
                                {filteredTasks.length === 0 && (
                                    <p className="py-3 text-gray-500 dark:text-gray-400">
                                        {project.tasks.length === 0 ? 'No tasks yet.' : 'No tasks match your search.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="min-w-0 break-words text-base font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                                    {isOwner && (
                                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">Owned</span>
                                    )}
                                </div>
                                {project.description && (
                                    <div className="mt-2">
                                        <p className={`break-words text-sm text-gray-500 dark:text-gray-400 ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                                            {project.description}
                                        </p>
                                        {project.description.length > 150 && (
                                            <button
                                                onClick={() => setShowFullDescription((v) => !v)}
                                                className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                {showFullDescription ? 'Show Less' : 'View Full Description'}
                                            </button>
                                        )}
                                    </div>
                                )}
                                <p className="mt-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Your role</p>
                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${roleStyles[role] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    {role}
                                </span>

                                {canManage && (
                                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                        <Link href={route('projects.settings', project.id)} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {isOwner ? 'Owner Settings' : 'Manager Settings'}
                                        </Link>
                                    </div>
                                )}

                                {!isOwner && role !== 'admin' && (
                                    <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                        <DangerButton onClick={leaveProject} className="w-full justify-center">
                                            Leave Project
                                        </DangerButton>
                                    </div>
                                )}
                            </div>

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
                            <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-base font-semibold dark:text-gray-100">My Notes</h3>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">Only visible to you</span>
                                </div>
                                <textarea
                                    value={noteForm.data.content}
                                    onChange={(e) => noteForm.setData('content', e.target.value)}
                                    placeholder="Note down anything about this project..."
                                    rows={6}
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                />
                                <div className="mt-2 flex items-center justify-between">
                                    <button
                                        onClick={saveNote}
                                        disabled={noteForm.processing}
                                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        Save Note
                                    </button>
                                    {noteSaved && <span className="text-xs text-green-600 dark:text-green-400">Saved ✓</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}