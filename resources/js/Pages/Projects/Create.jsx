import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import RichTextEditor from '@/Components/RichTextEditor';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({ name: '', description: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('projects.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">New Project</h2>}>
            <Head title="New Project" />
            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div>
                            <InputLabel htmlFor="name" value="Project Name" />
                            <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="description" value="Description" />
                            <RichTextEditor
                                value={data.description}
                                onChange={(html) => setData('description', html)}
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>
                        <PrimaryButton disabled={processing}>Create Project</PrimaryButton>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}