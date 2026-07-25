import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '@/Components/ConfirmDialog';

export default function useConfirm() {
    const [state, setState] = useState(null);
    const resolver = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            resolver.current = resolve;
            setState({ message, ...options });
        });
    }, []);

    const settle = (result) => {
        resolver.current?.(result);
        resolver.current = null;
        setState(null);
    };

    const ConfirmDialogElement = (
        <ConfirmDialog
            open={!!state}
            title={state?.title}
            message={state?.message}
            danger={state?.danger}
            confirmLabel={state?.confirmLabel}
            cancelLabel={state?.cancelLabel}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
        />
    );

    return { confirm, ConfirmDialog: ConfirmDialogElement };
}
