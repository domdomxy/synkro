import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useEffect, useRef, useState } from 'react';

// Fixed square viewport the photo is cropped against, in CSS pixels. The output
// file is rendered at OUTPUT_SIZE regardless of viewport size or original photo
// resolution, so avatars stay a consistent, reasonably-sized square everywhere.
const VIEWPORT_SIZE = 288;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clampOffset(offset, scale, naturalWidth, naturalHeight) {
    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;
    const minX = Math.min(0, VIEWPORT_SIZE - displayedWidth);
    const minY = Math.min(0, VIEWPORT_SIZE - displayedHeight);
    return {
        x: Math.min(0, Math.max(minX, offset.x)),
        y: Math.min(0, Math.max(minY, offset.y)),
    };
}

/**
 * Lets the user pan and zoom the photo they just picked, inside a fixed square
 * viewport, before it's uploaded as their avatar. Built on plain canvas + pointer
 * events rather than a cropper library, so no new dependency is needed.
 */
export default function AvatarCropperModal({ file, onCancel, onSave }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [naturalSize, setNaturalSize] = useState(null); // { width, height }
    const [baseScale, setBaseScale] = useState(1); // scale at which the shorter side exactly fills the viewport
    const [zoom, setZoom] = useState(1); // multiplier on top of baseScale, 1..MAX_ZOOM
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);

    const imgRef = useRef(null);
    const dragState = useRef(null); // { pointerId, startX, startY, startOffsetX, startOffsetY }

    useEffect(() => {
        if (!file) {
            setImageUrl(null);
            setNaturalSize(null);
            setZoom(1);
            return;
        }

        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        const scale = VIEWPORT_SIZE / Math.min(naturalWidth, naturalHeight);
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
        setBaseScale(scale);
        setZoom(1);
        setOffset(
            clampOffset(
                { x: (VIEWPORT_SIZE - naturalWidth * scale) / 2, y: (VIEWPORT_SIZE - naturalHeight * scale) / 2 },
                scale,
                naturalWidth,
                naturalHeight
            )
        );
    };

    const changeZoom = (nextZoom) => {
        if (!naturalSize) return;
        const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
        const oldScale = baseScale * zoom;
        const newScale = baseScale * clampedZoom;
        const center = VIEWPORT_SIZE / 2;

        // Zoom around the viewport's center so the subject doesn't jump when the slider moves.
        const newOffset = clampOffset(
            {
                x: center - (center - offset.x) * (newScale / oldScale),
                y: center - (center - offset.y) * (newScale / oldScale),
            },
            newScale,
            naturalSize.width,
            naturalSize.height
        );

        setZoom(clampedZoom);
        setOffset(newOffset);
    };

    const handlePointerDown = (e) => {
        if (!naturalSize) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragState.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: offset.x,
            startOffsetY: offset.y,
        };
    };

    const handlePointerMove = (e) => {
        const drag = dragState.current;
        if (!drag || drag.pointerId !== e.pointerId || !naturalSize) return;
        const scale = baseScale * zoom;
        setOffset(
            clampOffset(
                {
                    x: drag.startOffsetX + (e.clientX - drag.startX),
                    y: drag.startOffsetY + (e.clientY - drag.startY),
                },
                scale,
                naturalSize.width,
                naturalSize.height
            )
        );
    };

    const endDrag = (e) => {
        if (dragState.current?.pointerId === e.pointerId) {
            dragState.current = null;
        }
    };

    const handleWheel = (e) => {
        if (!naturalSize) return;
        e.preventDefault();
        changeZoom(zoom - e.deltaY * 0.0015);
    };

    const handleSave = () => {
        if (!naturalSize || !imgRef.current) return;
        setSaving(true);

        const scale = baseScale * zoom;
        const sourceX = -offset.x / scale;
        const sourceY = -offset.y / scale;
        const sourceSize = VIEWPORT_SIZE / scale;

        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgRef.current, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        canvas.toBlob(
            (blob) => {
                setSaving(false);
                if (!blob) return;
                const baseName = (file?.name || 'avatar').replace(/\.[^./]+$/, '');
                onSave(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.92
        );
    };

    const scale = baseScale * zoom;

    return (
        <Modal show={!!file} onClose={onCancel} maxWidth="md" overlayClassName="bg-black/55 dark:bg-black/70">
            <div className="p-6">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Photo</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Drag to reposition, and use the slider to zoom.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        aria-label="Close"
                        className="shrink-0 rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div
                    className="relative mx-auto mt-4 select-none overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-black/10"
                    style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onWheel={handleWheel}
                >
                    {imageUrl && (
                        <img
                            ref={imgRef}
                            src={imageUrl}
                            onLoad={handleImageLoad}
                            alt="Crop preview"
                            draggable={false}
                            className={`absolute cursor-grab active:cursor-grabbing ${naturalSize ? 'opacity-100' : 'opacity-0'}`}
                            style={
                                naturalSize
                                    ? {
                                          left: offset.x,
                                          top: offset.y,
                                          width: naturalSize.width * scale,
                                          height: naturalSize.height * scale,
                                          maxWidth: 'none',
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {!naturalSize && (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Loading…</div>
                    )}
                </div>

                <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => changeZoom(parseFloat(e.target.value))}
                    disabled={!naturalSize}
                    className="mt-4 w-full accent-indigo-600 disabled:opacity-50"
                />

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={onCancel} disabled={saving}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton onClick={handleSave} disabled={!naturalSize || saving}>
                        {saving ? 'Saving…' : 'Use Photo'}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}
