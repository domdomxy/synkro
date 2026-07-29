import { statusLabels, statusStrokeColors } from '@/utils/taskStatus';

/**
 * Ring chart showing the task status breakdown, with the total in the middle.
 * Shared by the user dashboard ("My Tasks by Status") and the admin dashboard
 * ("Tasks by Status") so both stay visually identical and get fixed together.
 */
export default function StatusDonut({ tasksByStatus, total, size = 160, strokeWidth = 18 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;
    const segments = Object.keys(statusLabels).map((key) => {
        const count = tasksByStatus[key] ?? 0;
        const dash = total ? (count / total) * circumference : 0;
        const seg = { key, dash, offset: cumulative, count };
        cumulative += dash;
        return seg;
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-gray-700" />
                {segments.filter((s) => s.count > 0).map((s) => (
                    <circle
                        key={s.key}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={statusStrokeColors[s.key]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                        strokeDashoffset={-s.offset}
                        strokeLinecap="round"
                    />
                ))}
            </g>
            <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" style={{ fontSize: size >= 150 ? 30 : 26, fontWeight: 700 }}>
                {total}
            </text>
            <text x="50%" y="62%" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: size >= 150 ? 11 : 10 }}>
                Tasks
            </text>
        </svg>
    );
}
