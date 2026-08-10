import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

// JSZip (~100KB) and CodeEditor are only needed once someone actually opens
// a .zip deliverable, so both are pulled in on demand rather than added to
// every page bundle that can render DeliverableViewer.
const CodeEditor = lazy(() => import('@/Components/CodeEditor'));

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'];

// Same code/text split as DeliverableViewer - kept local so ZipViewer has no
// dependency on the parent's internals.
const CODE_EXTS = [
    'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'php', 'rb', 'go', 'rs',
    'java', 'c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'cs', 'css', 'scss', 'less',
    'html', 'htm', 'vue', 'sql', 'sh', 'bash', 'pl', 'swift', 'kt', 'kts',
];
const TEXT_EXTS = ['txt', 'md', 'markdown', 'json', 'csv', 'log', 'yml', 'yaml', 'xml', ...CODE_EXTS];

// Text preview is capped the same way DeliverableViewer caps its own fetch,
// so a huge source file inside the zip can't hang the tab on render.
const MAX_PREVIEW_CHARS = 200000;

function getExtension(name) {
    return name?.split('.').pop()?.toLowerCase() ?? '';
}

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

function FileIcon({ className = 'h-4 w-4 shrink-0' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function FolderIcon({ className = 'h-4 w-4 shrink-0' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    );
}

function BackIcon({ className = 'h-4 w-4' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    );
}

// Flattens JSZip's entry map into a sorted, indented list. Directories are
// synthesized from path segments (zip files don't always contain explicit
// directory entries) purely so the list reads like a file tree; they're
// non-interactive the same way the download log's parent listing is.
function buildRows(zip) {
    const dirDepths = new Set();
    const files = [];

    zip.forEach((relativePath, entry) => {
        if (entry.dir) return;
        const depth = relativePath.split('/').length - 1;
        for (let d = 0; d < depth; d += 1) {
            dirDepths.add(relativePath.split('/').slice(0, d + 1).join('/'));
        }
        files.push({ path: relativePath, depth, entry });
    });

    const dirRows = Array.from(dirDepths).map((path) => ({
        path,
        depth: path.split('/').length - 1,
        isDir: true,
    }));

    return [...dirRows, ...files].sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Inline archive browser for .zip deliverables/resources, rendered by
 * DeliverableViewer in place of the "no preview available" fallback. Lists
 * the archive's contents (directories synthesized visually, not as separate
 * downloadable rows) and lets a person drill into an individual file -
 * images and text/code get the same in-place preview DeliverableViewer
 * gives top-level files; anything else falls back to a per-entry download.
 *
 * The whole archive is only decompressed once, in memory, via JSZip - there
 * is no server-side unzip endpoint, so this only works for archives small
 * enough for the browser to hold comfortably.
 */
export default function ZipViewer({ url, name }) {
    const [status, setStatus] = useState('loading'); // loading | ready | error
    const [rows, setRows] = useState([]);
    const [zip, setZip] = useState(null);
    const [selected, setSelected] = useState(null); // row for the entry being previewed
    const [entryPreview, setEntryPreview] = useState(null); // { kind: 'text'|'image'|'unsupported', content/url, truncated }
    const [entryLoading, setEntryLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setSelected(null);
        setEntryPreview(null);

        (async () => {
            try {
                const [{ default: JSZip }, res] = await Promise.all([import('jszip'), fetch(url)]);
                if (!res.ok) throw new Error('fetch failed');
                const buffer = await res.arrayBuffer();
                const loaded = await JSZip.loadAsync(buffer);
                if (cancelled) return;
                setZip(loaded);
                setRows(buildRows(loaded));
                setStatus('ready');
            } catch {
                if (!cancelled) setStatus('error');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [url]);

    // Revoke any blob URL created for an image preview once it's no longer shown.
    useEffect(() => {
        return () => {
            if (entryPreview?.kind === 'image') URL.revokeObjectURL(entryPreview.url);
        };
    }, [entryPreview]);

    const fileCount = useMemo(() => rows.filter((r) => !r.isDir).length, [rows]);

    async function openEntry(row) {
        setSelected(row);
        setEntryPreview(null);
        setEntryLoading(true);

        const ext = getExtension(row.path);
        try {
            if (IMAGE_EXTS.includes(ext) && ext !== 'svg') {
                const blob = await row.entry.async('blob');
                setEntryPreview({ kind: 'image', url: URL.createObjectURL(blob) });
            } else if (ext === 'svg' || TEXT_EXTS.includes(ext)) {
                const text = await row.entry.async('text');
                setEntryPreview({
                    kind: ext === 'svg' ? 'text' : 'text',
                    isCode: CODE_EXTS.includes(ext),
                    content: text.slice(0, MAX_PREVIEW_CHARS),
                    truncated: text.length > MAX_PREVIEW_CHARS,
                });
            } else {
                setEntryPreview({ kind: 'unsupported' });
            }
        } catch {
            setEntryPreview({ kind: 'error' });
        } finally {
            setEntryLoading(false);
        }
    }

    async function downloadEntry(row) {
        const blob = await row.entry.async('blob');
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = row.path.split('/').pop();
        a.click();
        URL.revokeObjectURL(blobUrl);
    }

    if (status === 'loading') {
        return (
            <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Reading archive…
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Couldn't read this archive.</p>
                <a
                    href={url}
                    download={name}
                    className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                    Download {name}
                </a>
            </div>
        );
    }

    // Detail pane: a single entry selected from the list.
    if (selected) {
        const ext = getExtension(selected.path);
        return (
            <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                    <button
                        onClick={() => setSelected(null)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <BackIcon className="h-3.5 w-3.5" />
                        Back to contents
                    </button>
                    <p className="min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400" title={selected.path}>
                        {selected.path}
                    </p>
                    <button
                        onClick={() => downloadEntry(selected)}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                    >
                        Download
                    </button>
                </div>
                <div className={`min-h-0 flex-1 ${entryPreview?.isCode ? 'overflow-hidden' : 'overflow-auto'} bg-gray-50 dark:bg-gray-900`}>
                    {entryLoading && (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                            Loading preview…
                        </div>
                    )}
                    {!entryLoading && entryPreview?.kind === 'image' && (
                        <div className="flex h-full items-center justify-center p-4">
                            <img src={entryPreview.url} alt={selected.path} className="max-h-full max-w-full object-contain" />
                        </div>
                    )}
                    {!entryLoading && entryPreview?.kind === 'text' && (
                        entryPreview.isCode ? (
                            <Suspense
                                fallback={
                                    <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                                        Loading preview…
                                    </div>
                                }
                            >
                                <CodeEditor value={entryPreview.content} onChange={() => {}} extension={ext} readOnly className="h-full" />
                            </Suspense>
                        ) : (
                            <pre className="whitespace-pre-wrap break-words p-4 text-xs text-gray-700 dark:text-gray-300">
                                {entryPreview.content}
                            </pre>
                        )
                    )}
                    {!entryLoading && (entryPreview?.kind === 'unsupported' || entryPreview?.kind === 'error') && (
                        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                            <FileIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {entryPreview.kind === 'error' ? "Couldn't read this file." : 'No inline preview available for this file type.'}
                            </p>
                            <button
                                onClick={() => downloadEntry(selected)}
                                className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                            >
                                Download {selected.path.split('/').pop()}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // List pane: the archive's contents.
    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </div>
            <div className="min-h-0 flex-1 overflow-auto py-1">
                {rows.map((row) => (
                    <div
                        key={row.path}
                        role={row.isDir ? undefined : 'button'}
                        tabIndex={row.isDir ? undefined : 0}
                        onClick={row.isDir ? undefined : () => openEntry(row)}
                        onKeyDown={row.isDir ? undefined : (e) => e.key === 'Enter' && openEntry(row)}
                        className={`flex items-center gap-2 px-4 py-1.5 text-sm ${
                            row.isDir
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'cursor-pointer text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                        style={{ paddingLeft: `${1 + row.depth * 1.25}rem` }}
                    >
                        {row.isDir ? <FolderIcon /> : <FileIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />}
                        <span className="min-w-0 flex-1 truncate">{row.path.split('/').pop()}</span>
                        {!row.isDir && (
                            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                                {formatBytes(row.entry._data?.uncompressedSize ?? 0)}
                            </span>
                        )}
                    </div>
                ))}
                {rows.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">This archive is empty.</p>
                )}
            </div>
        </div>
    );
}
