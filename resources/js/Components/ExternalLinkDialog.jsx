import Modal from '@/Components/Modal';

function CloseIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

/**
 * Splits a URL into { prefix, host, rest } so the hostname can be rendered in
 * a heavier weight than the rest of the URL, matching how Discord's own
 * "Leaving Discord" dialog highlights the domain within the full link.
 */
function splitUrl(url, hostname) {
    if (!url || !hostname) return { prefix: '', host: '', rest: url ?? '' };
    const hostIndex = url.indexOf(hostname);
    if (hostIndex === -1) return { prefix: '', host: '', rest: url };
    return {
        prefix: url.slice(0, hostIndex),
        host: hostname,
        rest: url.slice(hostIndex + hostname.length),
    };
}

/**
 * External-link confirmation dialog modeled on Discord's "Leaving Discord"
 * prompt: left-aligned bold title with its own close button, a plain
 * explanatory line, the destination URL shown in a bordered field with the
 * hostname emphasized, an optional "trust this domain" checkbox, and a
 * two-button footer (neutral Go Back, solid indigo Visit Site).
 */
export default function ExternalLinkDialog({ open, hostname, url, trustChecked, onTrustChange, onConfirm, onCancel }) {
    const { prefix, host, rest } = splitUrl(url, hostname);

    return (
        <Modal show={!!open} onClose={onCancel} maxWidth="md" overlayClassName="bg-black/55 backdrop-blur-[2px] dark:bg-black/70">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">Leaving Synkro</h2>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">This link is taking you to the following website</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4 truncate rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm dark:border-neutral-600 dark:bg-neutral-900/60" title={url}>
                    <span className="text-neutral-500 dark:text-neutral-400">{prefix}</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{host}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">{rest}</span>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                    <input
                        type="checkbox"
                        checked={trustChecked}
                        onChange={(e) => onTrustChange(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-600 dark:bg-neutral-700"
                    />
                    Trust <span className="font-semibold">{hostname}</span> links from now on
                </label>

                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        autoFocus
                        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Go Back
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800"
                    >
                        Visit Site
                    </button>
                </div>
            </div>
        </Modal>
    );
}
