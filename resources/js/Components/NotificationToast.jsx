import { useEcho } from '@laravel/echo-react';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function NotificationToast() {
    const { auth } = usePage().props;
    const [toast, setToast] = useState(null);

    useEcho(
        `user.${auth.user.id}`,
        ['.task.assigned', '.task.reviewed'],
        (payload) => {
            if (payload.decision) {
                const verb = payload.decision === 'approve' ? 'approved' : 'sent back for changes';
                setToast(`"${payload.title}" was ${verb}${payload.feedback ? ': ' + payload.feedback : ''}`);
            } else {
                setToast(`You were assigned a new task: "${payload.title}"`);
            }
        },
        [auth.user.id],
    );

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 6000);
        return () => clearTimeout(timer);
    }, [toast]);

    if (!toast) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
            {toast}
        </div>
    );
}