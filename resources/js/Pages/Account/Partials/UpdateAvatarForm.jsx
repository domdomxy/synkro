import Avatar from '@/Components/Avatar';
import AvatarCropperModal from '@/Components/AvatarCropperModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import { useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import useConfirm from '@/hooks/useConfirm';

export default function UpdateAvatarForm({ className = '' }) {
    const user = usePage().props.auth.user;
    const fileInput = useRef(null);
    const [pendingFile, setPendingFile] = useState(null); // raw file, awaiting crop
    const [preview, setPreview] = useState(null); // object URL of the cropped result
    const { setData, post, processing, errors, reset } = useForm({ avatar: null });
    const { confirm, ConfirmDialog } = useConfirm();

    const pickFile = () => fileInput.current.click();

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingFile(file);
        // Reset so choosing the same file again still fires onChange.
        e.target.value = '';
    };

    const onCropCancel = () => setPendingFile(null);

    const onCropSave = (croppedFile) => {
        setData('avatar', croppedFile);
        setPreview(URL.createObjectURL(croppedFile));
        setPendingFile(null);
    };

    const cancelPreview = () => {
        setData('avatar', null);
        setPreview(null);
        if (fileInput.current) fileInput.current.value = '';
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!(await confirm('Save this as your new avatar?', { title: 'Save Avatar?' }))) return;
        post(route('account.avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };

    const removeAvatar = async () => {
        if (await confirm('This cannot be undone.', { title: 'Remove Avatar?', danger: true, confirmLabel: 'Remove' })) {
            router.delete(route('account.avatar.destroy'));
        }
    };

    return (
        <section className={className}>

            <form onSubmit={submit} className="mt-4 flex items-center gap-5">
                {preview ? (
                    <img src={preview} alt="Preview" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-indigo-400" />
                ) : (
                    <Avatar user={user} size="h-24 w-24" rounded="rounded-2xl" />
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
            {ConfirmDialog}
            <AvatarCropperModal file={pendingFile} onCancel={onCropCancel} onSave={onCropSave} />
        </section>
    );
}