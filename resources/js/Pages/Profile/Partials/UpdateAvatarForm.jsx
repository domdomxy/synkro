import Avatar from '@/Components/Avatar';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import { useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdateAvatarForm({ className = '' }) {
    const user = usePage().props.auth.user;
    const fileInput = useRef(null);
    const [preview, setPreview] = useState(null);
    const { setData, post, processing, errors, reset } = useForm({ avatar: null });

    const pickFile = () => fileInput.current.click();

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('avatar', file);
        setPreview(URL.createObjectURL(file));
    };

    const cancelPreview = () => {
        setData('avatar', null);
        setPreview(null);
        if (fileInput.current) fileInput.current.value = '';
    };

    const submit = (e) => {
        e.preventDefault();
        if (!confirm('Save this as your new avatar?')) return;
        post(route('profile.avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };

    const removeAvatar = () => {
        if (confirm('Remove your avatar? This cannot be undone.')) {
            router.delete(route('profile.avatar.destroy'));
        }
    };

    return (
        <section className={className}>

            <form onSubmit={submit} className="mt-4 flex items-center gap-5">
                {preview ? (
                    <img src={preview} alt="Preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-400" />
                ) : (
                    <Avatar user={user} size="h-16 w-16" />
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <input ref={fileInput} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    <SecondaryButton type="button" onClick={pickFile}>
                        {preview ? 'Choose a Different Photo' : 'Choose Photo'}
                    </SecondaryButton>

                    {preview && (
                        <>
                            <PrimaryButton disabled={processing}>Save Avatar</PrimaryButton>
                            <button type="button" onClick={cancelPreview} className="text-sm text-gray-500 hover:underline">
                                Cancel
                            </button>
                        </>
                    )}

                    {!preview && user.avatar_path && (
                        <DangerButton type="button" onClick={removeAvatar}>
                            Remove Avatar
                        </DangerButton>
                    )}
                </div>
            </form>
            <InputError message={errors.avatar} className="mt-2" />
        </section>
    );
}