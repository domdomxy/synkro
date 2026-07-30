import { forwardRef, useState } from 'react';
import TextInput from '@/Components/TextInput';
import { EyeIcon, EyeOffIcon } from '@/Components/Auth/icons';

/**
 * TextInput wrapper for type="password" fields that need a show/hide
 * toggle outside the auth pages (AuthField.jsx covers those). Same
 * eye icon behavior and the same .password-toggle-field class that
 * hides Microsoft Edge's native reveal icon, so the two never stack.
 *
 * Forwards its ref straight through to TextInput, so existing
 * `inputRef.current.focus()` call sites keep working unchanged.
 */
const PasswordInput = forwardRef(function PasswordInput(
    { className = '', wrapperClassName = '', ...props },
    ref,
) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`relative ${wrapperClassName}`}>
            <TextInput
                {...props}
                ref={ref}
                type={visible ? 'text' : 'password'}
                className={`password-toggle-field pr-10 ${className}`}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label={visible ? 'Hide password' : 'Show password'}
            >
                {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
        </div>
    );
});

export default PasswordInput;
