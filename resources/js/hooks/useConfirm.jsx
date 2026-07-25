import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '@/Components/ConfirmDialog';

export default function useConfirm() {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const resolver = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            resolver.current = resolve;
            setData({ message, ...options });
            setOpen(true);
        });
    }, []);

    const settle = (result) => {
        resolver.current?.(result);
        resolver.current = null;
        setOpen(false);
        // Note: `data` is intentionally left as-is here. Clearing it immediately
        // would blank out the title/message/danger styling while the dialog is
        // still mid-way through its ~200ms fade-out, causing a visible flash of
        // an "empty" dialog. It gets naturally replaced the next time confirm()
        // is called with new content.
    };

    const ConfirmDialogElement = (
        <ConfirmDialog
            open={open}
            title={data?.title}
            message={data?.message}
            danger={data?.danger}
            confirmLabel={data?.confirmLabel}
            cancelLabel={data?.cancelLabel}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
        />
    );

    return { confirm, ConfirmDialog: ConfirmDialogElement };
}
