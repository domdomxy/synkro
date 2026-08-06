import { useEffect, useRef, useState } from 'react';
import { statusLabels, statusStrokeColors } from '@/utils/taskStatus';

/**
 * Ring chart showing the task status breakdown, with the total in the middle.
 * Shared by the user dashboard ("My Tasks by Status") and the admin dashboard
 * ("Tasks by Status") so both stay visually identical and get fixed together.
 *
 * Animated: segments draw in from empty on mount, glide smoothly to their new
 * lengths whenever tasksByStatus/total changes (e.g. from real-time broadcast
 * updates), and the center total counts up rather than jumping.
 */
export default function StatusDonut({ tasksByStatus, total, size = 160, strokeWidth = 18 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Start every mount at zero so the ring animates in, then flip to the
    // real values a tick later - the CSS transition below does the rest.
    const [drawn, setDrawn] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setDrawn(true));
        return () => cancelAnimationFrame(id);
    }, []);

    let cumulative = 0;
    const segments = Object.keys(statusLabels).map((key) => {
        const count = tasksByStatus[key] ?? 0;
        const dash = total ? (count / total) * circumference : 0;
        const seg = { key, dash, offset: cumulative, count };
        cumulative += dash;
        return seg;
    });

    // Count the center number up/down to its target instead of snapping.
    const [displayTotal, setDisplayTotal] = useState(0);
    const prevTotal = useRef(0);
    useEffect(() => {
        const from = prevTotal.current;
        const to = total ?? 0;
        prevTotal.current = to;
        if (from === to) {
            setDisplayTotal(to);
            return;
        }
        const duration = 600;
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayTotal(Math.round(from + (to - from) * eased));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [total]);

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
                        strokeDasharray={drawn ? `${s.dash} ${circumference - s.dash}` : `0 ${circumference}`}
                        strokeDashoffset={-s.offset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                    />
                ))}
            </g>
            <text x="50%" y="46%" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" style={{ fontSize: size >= 150 ? 30 : 26, fontWeight: 700 }}>
                {displayTotal}
            </text>
            <text x="50%" y="62%" textAnchor="middle" className="fill-gray-400 dark:fill-gray-500" style={{ fontSize: size >= 150 ? 11 : 10 }}>
                Tasks
            </text>
        </svg>
    );
}
