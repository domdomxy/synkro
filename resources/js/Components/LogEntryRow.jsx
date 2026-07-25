import Linkify from '@/Components/Linkify';
import { describeLog, getLogDetails, ICON_PATHS, actionIconConfig } from '@/utils/activityLog';
import { useState } from 'react';

function Icon({ path, className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
}

function timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return null;
}

/**
 * A single activity-log entry: icon, description, timestamp, and (when the
 * log carries structured details) a click-to-expand diff panel. Used as-is
 * on the project Logs page, and in `dense` mode inside TaskRow's History
 * panel so the two look and behave the same way.
 */
export default function LogEntryRow({ log, dense = false }) {
    const [open, setOpen] = useState(false);
    const details = getLogDetails(log);
    const hasDetails = details.length > 0;
    const iconConfig = actionIconConfig[log.action] ?? { path: ICON_PATHS.dot, color: 'text-gray-400' };
    const relative = timeAgo(log.created_at);

    const rowPad = dense ? 'gap-2.5 px-2.5 py-2' : 'gap-3 px-6 py-3';
    const panelPad = dense ? 'px-2.5 py-2.5' : 'px-6 py-3';

    return (
        <li className={dense ? 'rounded-md border border-gray-100 dark:border-gray-700' : 'border-b dark:border-gray-700 last:border-0'}>
            <button
                type="button"
                onClick={() => hasDetails && setOpen((v) => !v)}
                className={`flex w-full items-start text-left transition ${rowPad} ${hasDetails ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
            >
                <span className={`mt-0.5 shrink-0 ${iconConfig.color}`}>
                    <Icon path={iconConfig.path} className={dense ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className={dense ? 'text-sm text-gray-700 dark:text-gray-300' : 'text-sm text-gray-800 dark:text-gray-200'}>{describeLog(log)}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        {relative && <span className="ml-1.5 text-gray-300 dark:text-gray-600">· {relative}</span>}
                    </p>
                </div>
                {hasDetails && (
                    <svg
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {open && hasDetails && (
                <div className={`border-t border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 ${panelPad}`}>
                    <dl className="space-y-2">
                        {details.map((item, i) => (
                            <div key={i}>
                                {item.isChange ? (
                                    item.isHtml ? (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1.5 space-y-2">
                                                <div className="rounded-md border border-red-100 bg-red-50/50 p-2.5 dark:border-red-900 dark:bg-red-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-red-400 dark:text-red-500">Previous</p>
                                                    <div
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.oldValue && item.oldValue !== '-'
                                                                ? item.oldValue
                                                                : '<span class="italic text-gray-400">Empty</span>',
                                                        }}
                                                    />
                                                </div>
                                                <div className="rounded-md border border-green-100 bg-green-50/50 p-2.5 dark:border-green-900 dark:bg-green-950/20">
                                                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-green-500 dark:text-green-400">Updated</p>
                                                    <div
                                                        className="max-w-none whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{
                                                            __html: item.newValue && item.newValue !== '-'
                                                                ? item.newValue
                                                                : '<span class="italic text-gray-400">Empty</span>',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                            <div className="mt-1 flex items-center gap-2 text-sm">
                                                <span className="rounded bg-red-100 px-2 py-0.5 text-red-700 line-through dark:bg-red-900/40 dark:text-red-400">
                                                    {item.oldValue || '-'}
                                                </span>
                                                <svg className="h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="rounded bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                                    {item.newValue || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <dt className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{item.label}</dt>
                                        <dd className="break-words text-sm text-gray-700 dark:text-gray-300">
                                            {item.label === 'Reason' ? <Linkify text={item.value} /> : item.value}
                                        </dd>
                                    </div>
                                )}
                            </div>
                        ))}
                    </dl>
                </div>
            )}
        </li>
    );
}
