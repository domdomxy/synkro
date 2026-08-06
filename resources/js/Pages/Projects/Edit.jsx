import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Spinner from '@/Components/Spinner';
import { Head, useForm } from '@inertiajs/react';
import BackButton from '@/Components/BackButton';
import useConfirm from '@/hooks/useConfirm';

export default function Edit({ project }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: project.name,
        description: project.description ?? '',
    });

    const { confirm, ConfirmDialog } = useConfirm();

    const submit = async (e) => {
        e.preventDefault();
        if (await confirm('Save changes to this project?', { title: 'Save Changes?' })) {
            patch(route('projects.update', project.id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit Project</h2>}>
            <Head title="Edit Project" />
            <div className="py-12">
                <div className="mb-4">
                    <BackButton href={route('projects.show', project.id)} label="Back to Project" />
                </div>
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:p-6">
                        <div>
                            <InputLabel htmlFor="name" value="Project Name" />
                            <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="description" value="Description" />
                            <textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" rows={4} />
                            <InputError message={errors.description} className="mt-2" />
                        </div>
                        <PrimaryButton disabled={processing}>
                            {processing && <Spinner className="mr-2 h-4 w-4" />}
                            Save Changes
                        </PrimaryButton>
                    </form>
                </div>
            </div>
            {ConfirmDialog}
        </AuthenticatedLayout>
    );
}