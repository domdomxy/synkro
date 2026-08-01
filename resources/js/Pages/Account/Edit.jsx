import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AccountPanel from '@/Components/AccountPanel';
import { Head, router } from '@inertiajs/react';

/**
 * Only renders for a real visit to /account (typed URL, refresh, bookmark).
 * Reached through the account menu instead, AuthenticatedLayout opens
 * AccountPanel directly as an overlay on the page that was already showing
 * (see useRouteOverlay) so that page stays visible behind the dialog.
 */
export default function Edit(props) {
    const closeStandalone = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(route('dashboard'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Account" />
            <AccountPanel {...props} onClose={closeStandalone} />
        </AuthenticatedLayout>
    );
}
