import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import RichTextContent from '@/Components/RichTextContent';

export default function ProjectInfoModal({ show, onClose, project }) {
    const formatTimestamp = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl" overlayClassName="bg-black/55 dark:bg-black/70">
            <div className="flex max-h-[80vh] flex-col">
                <div className="flex items-start justify-between gap-2 border-b border-gray-100 p-6 pb-4 dark:border-gray-700">
                    <div className="min-w-0">
                        <h2 className="break-words text-lg font-semibold text-gray-900 dark:text-gray-100">{project.name}</h2>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Project ID: {project.id}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Created {formatTimestamp(project.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Last updated {formatTimestamp(project.updated_at)}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Description</p>
                    <RichTextContent
                        className="mt-2 whitespace-pre-wrap break-words text-base text-gray-900 dark:text-gray-100"
                        style={{ tabSize: 4 }}
                        html={project.description}
                        fallback='<span class="text-gray-400">No description provided.</span>'
                    />
                </div>

                <div className="flex justify-end border-t border-gray-100 p-4 dark:border-gray-700">
                    <SecondaryButton onClick={onClose}>Close</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
