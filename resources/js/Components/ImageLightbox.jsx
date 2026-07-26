import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function CloseIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

function ChevronIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

function DownloadIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
        </svg>
    );
}

/**
 * Full-screen in-page viewer for a set of images (e.g. feedback/ticket
 * attachments), so clicking a thumbnail doesn't leave the app in a new tab.
 * Controlled from the parent via `index` (null/undefined = closed).
 *
 * Rendered through a portal into document.body so it sits above everything
 * regardless of where the triggering thumbnail lives in the DOM (deeply
 * nested cards, scroll containers, etc).
 */
export default function ImageLightbox({ images, index, onClose, onIndexChange }) {
    const open = index != null && images?.[index];

    useEffect(() => {
        if (!open) return;

        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && images.length > 1) onIndexChange((index - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight' && images.length > 1) onIndexChange((index + 1) % images.length);
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, index, images?.length]);

    if (!open) return null;

    const current = images[index];
    const hasMultiple = images.length > 1;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt || 'Image preview'}
        >
            <div className="absolute right-3 top-3 flex items-center gap-1.5 sm:right-5 sm:top-5">
                <a
                    href={current.src}
                    download={current.alt || undefined}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Download image"
                    title="Download"
                    className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <DownloadIcon className="h-5 w-5" />
                </a>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <CloseIcon className="h-6 w-6" />
                </button>
            </div>

            {hasMultiple && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + images.length) % images.length); }}
                        aria-label="Previous image"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white sm:left-4"
                    >
                        <ChevronIcon className="h-7 w-7" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % images.length); }}
                        aria-label="Next image"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white sm:right-4"
                    >
                        <ChevronIcon className="h-7 w-7 rotate-180" />
                    </button>
                </>
            )}

            <img
                src={current.src}
                alt={current.alt || ''}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full select-none rounded-md object-contain shadow-2xl"
                draggable={false}
            />

            {hasMultiple && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white/80">
                    {index + 1} / {images.length}
                </div>
            )}
        </div>,
        document.body
    );
}
