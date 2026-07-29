import { useCallback, useRef, useState } from 'react';
import MuteScopeDialog from '@/Components/MuteScopeDialog';

export default function useMuteScope() {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const resolver = useRef(null);

    const askMuteScope = useCallback((options = {}) => {
        return new Promise((resolve) => {
            resolver.current = resolve;
            setData(options);
            setOpen(true);
        });
    }, []);

    const settle = (result) => {
        resolver.current?.(result);
        resolver.current = null;
        setOpen(false);
        // `data` is intentionally left as-is so the dialog doesn't flash empty
        // during its fade-out - see useConfirm for the same pattern.
    };

    const MuteScopeDialogElement = (
        <MuteScopeDialog
            open={open}
            title={data?.title}
            message={data?.message}
            defaultScope={data?.defaultScope}
            confirmLabel={data?.confirmLabel}
            onConfirm={(scope) => settle(scope)}
            onCancel={() => settle(null)}
        />
    );

    return { askMuteScope, MuteScopeDialog: MuteScopeDialogElement };
}
