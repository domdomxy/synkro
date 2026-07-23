import { forwardRef, useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import { EyeIcon, EyeOffIcon } from '@/Components/Auth/icons';

/**
 * Labeled form field used across the auth pages. Wraps the existing
 * InputLabel/TextInput/InputError primitives (unchanged, still shared with
 * the rest of the app) and adds two auth-specific conveniences:
 *   - an optional leading icon
 *   - a show/hide toggle when type="password"
 */
const AuthField = forwardRef(function AuthField(
    { id, label, type = 'text', icon: Icon, error, containerClassName = '', className = '', ...props },
    ref,
) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (visible ? 'text' : 'password') : type;

    return (
        <div className={containerClassName}>
            <InputLabel htmlFor={id} value={label} />
            <div className="relative mt-1">
                {Icon && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <TextInput
                    id={id}
                    ref={ref}
                    type={inputType}
                    className={`block w-full ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''} ${className}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setVisible((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        aria-label={visible ? 'Hide password' : 'Show password'}
                    >
                        {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                )}
            </div>
            <InputError message={error} className="mt-1.5" />
        </div>
    );
});

export default AuthField;
