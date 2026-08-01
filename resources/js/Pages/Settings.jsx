import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsPanel from '@/Components/SettingsPanel';
import { Head, router } from '@inertiajs/react';

/**
 * This component only renders for a real Inertia visit to /settings -
 * a typed URL, a refresh, a bookmark - where there's no earlier page
 * still mounted behind it. Reached through the account menu instead,
 * AuthenticatedLayout opens SettingsPanel directly as an overlay on top
 * of whatever page was already showing (see useRouteOverlay), so that
 * page stays visible behind the dialog instead of being replaced.
 */
export default function Settings(props) {
    const closeStandalone = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(route('dashboard'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Settings" />
            <SettingsPanel {...props} onClose={closeStandalone} />
        </AuthenticatedLayout>
    );
}
