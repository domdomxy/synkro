// Shared between Projects/Deliverables.jsx (task submission files) and
// Projects/Resources.jsx (owner/manager-dropped project files) so the same
// file picks up the same icon and color everywhere in the app.

export function getExtension(name) {
    return name?.split('.').pop()?.toLowerCase() ?? '';
}

export function formatSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// One category per file family, each with its own accent color. The color
// is the whole point: it lets someone scan a long list of mixed resources
// and pick out "the spreadsheets" or "the zip" without reading every label.
const CATEGORIES = {
    markdown: {
        label: 'DOC',
        badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        border: 'border-l-amber-300 dark:border-l-amber-700',
    },
    presentation: {
        label: 'SLIDES',
        badge: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
        border: 'border-l-orange-300 dark:border-l-orange-700',
    },
    image: {
        label: 'IMAGE',
        badge: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400',
        border: 'border-l-fuchsia-300 dark:border-l-fuchsia-700',
    },
    pdf: {
        label: 'PDF',
        badge: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
        border: 'border-l-rose-300 dark:border-l-rose-700',
    },
    archive: {
        label: 'ZIP',
        badge: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
        border: 'border-l-violet-300 dark:border-l-violet-700',
    },
    document: {
        label: 'DOC',
        badge: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        border: 'border-l-blue-300 dark:border-l-blue-700',
    },
    spreadsheet: {
        label: 'SHEET',
        badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        border: 'border-l-emerald-300 dark:border-l-emerald-700',
    },
    default: {
        label: 'FILE',
        badge: 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400',
        border: 'border-l-gray-200 dark:border-l-gray-600',
    },
};

// Links aren't a file extension, so they get their own metadata, kept in
// the same shape as the file categories so callers can treat them alike.
export const LINK_META = {
    label: 'LINK',
    badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    border: 'border-l-indigo-300 dark:border-l-indigo-700',
};

function getCategory(name) {
    const ext = getExtension(name);
    const base = name?.replace(/\.[^./]+$/, '') ?? '';
    const isReadme = /^readme$/i.test(base);

    if (isReadme || ['md', 'markdown'].includes(ext)) return 'markdown';
    if (['ppt', 'pptx', 'key', 'odp'].includes(ext)) return 'presentation';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    return 'default';
}

/** Badge/border/label metadata for a file name, for color-coding icons and chips. */
export function getFileTypeMeta(name) {
    return CATEGORIES[getCategory(name)];
}

export default function FileTypeIcon({ name, className = 'h-4 w-4' }) {
    const category = getCategory(name);

    if (category === 'markdown') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.5c-1.6-1-4.2-1.4-6-1v12.5c1.8-.4 4.4 0 6 1 1.6-1 4.2-1.4 6-1V5.5c-1.8-.4-4.4 0-6 1z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5v12.5" />
            </svg>
        );
    }
    if (category === 'presentation') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM8 20h8m-4-4v4"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 8.3l4 2.7-4 2.7V8.3z" />
            </svg>
        );
    }
    if (category === 'image') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }
    if (category === 'pdf') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }
    if (category === 'archive') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        );
    }
    if (category === 'document') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m3 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }
    if (category === 'spreadsheet') {
        return (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-9 4h14a2 2 0 002-2V7a2 2 0 00-2-2h-5.586a1 1 0 01-.707-.293L9.293 3.293A1 1 0 008.586 3H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}
