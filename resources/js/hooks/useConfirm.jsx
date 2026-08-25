import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '@/Components/ConfirmDialog';

export default function useConfirm() {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const resolver = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        // When a caller passes `skipKey`, honor a previously-checked "don't show this
        // again" for that key by resolving immediately without ever opening the dialog -
        // mirrors the per-page skip pattern used on the Tasks archive dialog, just
        // generalized so any confirm() call can opt in.
        if (options.skipKey) {
            let skip = false;
            try { skip = localStorage.getItem(options.skipKey) === '1'; } catch { /* private browsing, etc. */ }
            if (skip) return Promise.resolve(true);
        }
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
            note={data?.note}
            danger={data?.danger}
            confirmLabel={data?.confirmLabel}
            cancelLabel={data?.cancelLabel}
            choices={data?.choices}
            hideCancel={data?.hideCancel}
            skipKey={data?.skipKey}
            // Without `choices`, confirm() resolves to a plain boolean as before. With
            // `choices`, it resolves to the selected choice's value (or false on cancel),
            // so callers can tell which option was picked.
            onConfirm={(value) => settle(value)}
            onCancel={() => settle(false)}
        />
    );

    return { confirm, ConfirmDialog: ConfirmDialogElement };
}
