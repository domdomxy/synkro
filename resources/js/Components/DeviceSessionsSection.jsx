import { router } from '@inertiajs/react';
import useConfirm from '@/hooks/useConfirm';

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

const ICON_PATHS = {
    desktop: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z',
    mobile: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    location: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
    devices: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z',
};

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DeviceRow({ device, onDisconnect }) {
    const isMobileDevice = device.device === 'Mobile' || device.device === 'Tablet';
    const deviceLabel = [device.model ? `${device.device} (${device.model})` : device.device, device.os].filter(Boolean).join(' · ');
    const detailLine = [device.location, device.ip].filter(Boolean).join(' - ');

    return (
        <div className="flex flex-nowrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-3 transition last:border-0 hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-700/20 sm:gap-3 sm:px-4 sm:py-3.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    <Icon path={isMobileDevice ? ICON_PATHS.mobile : ICON_PATHS.desktop} className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                            {device.browser} on {deviceLabel}
                        </p>
                        {device.is_current && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-600 dark:bg-green-950/30 dark:text-green-400">
                                This device
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 flex flex-nowrap items-center gap-x-1.5 overflow-hidden">
                        {detailLine && <p className="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">{detailLine}</p>}
                        {detailLine && <span className="shrink-0 text-gray-300 dark:text-gray-600">·</span>}
                        <p className="shrink-0 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                            {device.is_current ? 'Active now' : `Active ${timeAgo(device.last_active_at)}`}
                        </p>
                    </div>
                </div>
            </div>
            {!device.is_current && (
                <button
                    type="button"
                    onClick={() => onDisconnect(device)}
                    className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                    Disconnect
                </button>
            )}
        </div>
    );
}

export default function DeviceSessionsSection({ devices }) {
    const { confirm, ConfirmDialog } = useConfirm();
    const otherCount = devices.filter((d) => !d.is_current).length;

    const disconnectDevice = async (device) => {
        const ok = await confirm(
            `${device.browser} on ${device.device} will be signed out immediately.`,
            { title: 'Disconnect this device?', danger: true, confirmLabel: 'Disconnect' }
        );
        if (ok) router.delete(route('settings.devices.disconnect', device.id), { preserveScroll: true });
    };

    const disconnectOthers = async () => {
        const ok = await confirm(
            `${otherCount} other device${otherCount === 1 ? '' : 's'} will be signed out immediately. This device stays signed in.`,
            { title: 'Log out of all other devices?', danger: true, confirmLabel: 'Log out others' }
        );
        if (ok) router.delete(route('settings.devices.disconnect-others'), { preserveScroll: true });
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Where you're logged in
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                        Devices and browsers currently signed in to your account. Disconnect anything you don't recognize.
                    </p>
                </div>
                {otherCount > 0 && (
                    <button
                        type="button"
                        onClick={disconnectOthers}
                        className="shrink-0 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        Log out of all other devices
                    </button>
                )}
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                {devices.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <Icon path={ICON_PATHS.devices} className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions found.</p>
                    </div>
                ) : (
                    devices.map((device) => (
                        <DeviceRow key={device.id} device={device} onDisconnect={disconnectDevice} />
                    ))
                )}
            </div>

            {ConfirmDialog}
        </div>
    );
}
