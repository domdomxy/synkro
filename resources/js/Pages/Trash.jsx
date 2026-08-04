import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TrashPanel from '@/Components/TrashPanel';
import { Head, router } from '@inertiajs/react';

/**
 * This component only renders for a real Inertia visit to /trash -
 * a typed URL, a refresh, a bookmark - where there's no earlier page
 * still mounted behind it. Reached through the account menu instead,
 * AuthenticatedLayout opens TrashPanel directly as an overlay on top
 * of whatever page was already showing (see useRouteOverlay), so that
 * page stays visible behind the dialog instead of being replaced -
 * same split as Settings.jsx's SettingsPanel.
 */
export default function Trash(props) {
    const closeStandalone = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(route('dashboard'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Trash" />
            <TrashPanel {...props} onClose={closeStandalone} />
        </AuthenticatedLayout>
    );
}
