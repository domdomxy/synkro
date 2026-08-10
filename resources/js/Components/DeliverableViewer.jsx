import { lazy, Suspense, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';

// CodeMirror + its per-language packages (~1MB) are only needed when a code
// file is actually previewed. Lazy-loading it here keeps CodeMirror out of
// every page bundle that renders DeliverableViewer (Deliverables, Resources,
// TaskRow) and instead fetches it on demand, right before it's first used.
const CodeEditor = lazy(() => import('@/Components/CodeEditor'));
const ZipViewer = lazy(() => import('@/Components/ZipViewer'));

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'ogv'];
const AUDIO_EXTS = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
const ARCHIVE_EXTS = ['zip'];

// Plain-text / data formats - previewed as raw text.
const TEXT_EXTS = ['txt', 'md', 'markdown', 'json', 'csv', 'log', 'yml', 'yaml', 'xml'];

// Source code extensions - previewed with syntax highlighting via CodeEditor
// (in read-only mode). Kept as a separate list from TEXT_EXTS just so it's
// easy to tell which files get highlighting vs a plain <pre> dump.
const CODE_EXTS = [
    'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'php', 'rb', 'go', 'rs',
    'java', 'c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'cs', 'css', 'scss', 'less',
    'html', 'htm', 'vue', 'sql', 'sh', 'bash', 'pl', 'swift', 'kt', 'kts',
];

// Extensions that desktop Office can open directly from a public HTTPS URL
// via its registered OS protocol handlers (the same mechanism SharePoint/
// OneDrive use for "Open in Desktop App" links). Only works if the person
// has the matching desktop app installed and the browser allows launching
// external protocol handlers.
const OFFICE_APPS = {
    word: { label: 'Word', scheme: 'ms-word', exts: ['doc', 'docx', 'dot', 'dotx'] },
    excel: { label: 'Excel', scheme: 'ms-excel', exts: ['xls', 'xlsx', 'xlsm', 'xlt', 'xltx'] },
    powerpoint: { label: 'PowerPoint', scheme: 'ms-powerpoint', exts: ['ppt', 'pptx', 'pot', 'potx', 'pps', 'ppsx'] },
};

function getOfficeApp(ext) {
    return Object.values(OFFICE_APPS).find((app) => app.exts.includes(ext)) ?? null;
}

function absoluteUrl(url) {
    try {
        return new URL(url, window.location.origin).href;
    } catch {
        return url;
    }
}

function getExtension(name) {
    return name?.split('.').pop()?.toLowerCase() ?? '';
}

function CloseIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function NoPreview({ name, url, isFile, officeApp }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No inline preview available for this{isFile ? ' file type' : ' link'}.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {isFile ? (
                    <a
                        href={url}
                        download={name}
                        className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                        Download {name}
                    </a>
                ) : (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                        Open link
                    </a>
                )}
                {officeApp && (
                    <a
                        href={`${officeApp.scheme}:ofe|u|${absoluteUrl(url)}`}
                        className="rounded-md border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        Open in {officeApp.label}
                    </a>
                )}
            </div>
            {officeApp && (
                <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">
                    Requires desktop {officeApp.label} installed on this computer. Your browser may ask to confirm opening it.
                </p>
            )}
        </div>
    );
}

/**
 * In-app preview for a task deliverable or project resource (uploaded file
 * or external link). Clicking one opens this modal instead of navigating
 * away in a new tab. Files hosted on Synkro (images, PDFs, audio/video,
 * plain text, source code) render inline; other file types fall back to a
 * "download" action inside the same modal rather than the browser silently
 * opening a new tab.
 *
 * Code files (CODE_EXTS) get syntax highlighting via CodeEditor in
 * read-only mode rather than a flat <pre> dump - this is view-only for now,
 * no editing/saving.
 *
 * External links are NOT embedded via iframe: most third-party sites send
 * X-Frame-Options/CSP headers that block framing anyway, so attempting it
 * just shows a confusing blank frame most of the time. Links go straight
 * to the same fallback panel as non-previewable files, with an explicit
 * "Open in new tab" action.
 */
export default function DeliverableViewer({ deliverable, onClose }) {
    const open = !!deliverable;
    const isFile = deliverable?.type === 'file';
    const url = isFile ? `/storage/${deliverable.path}` : deliverable?.url;
    const name = isFile ? deliverable.original_name : (deliverable?.title || deliverable?.url);
    const ext = getExtension(isFile ? deliverable?.original_name : deliverable?.url);

    const isImage = isFile && IMAGE_EXTS.includes(ext);
    const isVideo = isFile && VIDEO_EXTS.includes(ext);
    const isAudio = isFile && AUDIO_EXTS.includes(ext);
    const isCode = isFile && CODE_EXTS.includes(ext);
    const isText = isFile && (TEXT_EXTS.includes(ext) || isCode);
    const isPdf = isFile && ext === 'pdf';
    const isArchive = isFile && ARCHIVE_EXTS.includes(ext);
    const isPreviewableFile = isImage || isVideo || isAudio || isText || isPdf || isArchive;
    const officeApp = isFile ? getOfficeApp(ext) : null;

    const [textContent, setTextContent] = useState(null);
    const [textError, setTextError] = useState(false);

    useEffect(() => {
        if (!open || !isText || !url) return;
        let cancelled = false;
        setTextContent(null);
        setTextError(false);
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error('fetch failed');
                return res.text();
            })
            .then((t) => {
                if (!cancelled) setTextContent(t.slice(0, 200000));
            })
            .catch(() => {
                if (!cancelled) setTextError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [open, isText, url]);

    if (!open) return null;

    return (
        <Modal show={open} onClose={onClose} maxWidth="7xl" overlayClassName="bg-black/55 dark:bg-black/70">
            <div className="flex h-[88vh] flex-col">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <p className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200" title={name}>
                        {name}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                        {officeApp && (
                            <a
                                href={`${officeApp.scheme}:ofe|u|${absoluteUrl(url)}`}
                                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Open in {officeApp.label}
                            </a>
                        )}
                        {isFile && (
                            <a
                                href={url}
                                download={name}
                                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Download
                            </a>
                        )}
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                        >
                            Open in new tab
                        </a>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className={`min-h-0 flex-1 ${(isCode && textContent !== null && !textError) || isArchive ? 'overflow-hidden' : 'overflow-auto'} bg-gray-50 dark:bg-gray-900`}>
                    {isImage && (
                        <div className="flex h-full items-center justify-center p-4">
                            <img src={url} alt={name} className="max-h-full max-w-full object-contain" />
                        </div>
                    )}
                    {isPdf && <iframe src={url} title={name} className="h-full w-full" />}
                    {isVideo && (
                        <div className="flex h-full items-center justify-center p-4">
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video src={url} controls className="max-h-full max-w-full" />
                        </div>
                    )}
                    {isAudio && (
                        <div className="flex h-full items-center justify-center p-6">
                            <audio src={url} controls className="w-full max-w-md" />
                        </div>
                    )}
                    {isText && (
                        textError ? (
                            <NoPreview name={name} url={url} isFile={isFile} />
                        ) : textContent === null ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                                Loading preview…
                            </div>
                        ) : isCode ? (
                            <Suspense
                                fallback={
                                    <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                                        Loading preview…
                                    </div>
                                }
                            >
                                <CodeEditor value={textContent} onChange={() => {}} extension={ext} readOnly className="h-full" />
                            </Suspense>
                        ) : (
                            <pre className="whitespace-pre-wrap break-words p-4 text-xs text-gray-700 dark:text-gray-300">
                                {textContent}
                            </pre>
                        )
                    )}
                    {isArchive && (
                        <Suspense
                            fallback={
                                <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                                    Reading archive…
                                </div>
                            }
                        >
                            <ZipViewer url={url} name={name} />
                        </Suspense>
                    )}
                    {!isFile && <NoPreview name={name} url={url} isFile={false} />}
                    {isFile && !isPreviewableFile && <NoPreview name={name} url={url} isFile={isFile} officeApp={officeApp} />}
                </div>
            </div>
        </Modal>
    );
}
